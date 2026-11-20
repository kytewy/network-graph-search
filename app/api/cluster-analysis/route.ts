import { debugLog } from '@/lib/utils/debug';
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { LIMITS, badRequest, rateLimit, serverError, truncate } from '@/lib/utils/api-guard';

interface NodeInput {
	id: string;
	label: string;
	content: string;
	summary?: string;
	type: string;
}

interface ClusterAnalysisRequest {
	nodes: NodeInput[];
}

/**
 * POST /api/cluster-analysis
 * 
 * Accepts an array of nodes and returns cluster assignments using
 * TF-IDF + KMeans (backend/clustering/analyzer.py).
 * Cluster naming with an LLM happens separately in /api/analyze-cluster.
 */
export async function POST(request: NextRequest) {
	const limited = rateLimit(request, 'cluster');
	if (limited) return limited;

	try {
		const body: ClusterAnalysisRequest = await request.json();
		const { nodes } = body;

		// Validate input
		if (!nodes || !Array.isArray(nodes)) {
			return NextResponse.json(
				{ error: 'Invalid input: nodes array is required' },
				{ status: 400 }
			);
		}

		if (nodes.length < 5) {
			return NextResponse.json(
				{ error: 'At least 5 nodes are required for meaningful clustering' },
				{ status: 400 }
			);
		}

		if (nodes.length > LIMITS.MAX_NODES_CLUSTER) {
			return badRequest(`At most ${LIMITS.MAX_NODES_CLUSTER} nodes can be clustered at once`);
		}

		// Keep only the fields the analyzer uses, with long text truncated
		const safeNodes: NodeInput[] = nodes.map((node) => ({
			id: truncate(node?.id, 200),
			label: truncate(node?.label, 500),
			content: truncate(node?.content, LIMITS.MAX_CONTENT_CHARS),
			summary: truncate(node?.summary, LIMITS.MAX_CONTENT_CHARS),
			type: truncate(node?.type, 100),
		}));

		// Path to the clustering script (in backend/clustering/)
		const scriptPath = path.join(process.cwd(), 'backend', 'clustering', 'cli.py');

		// Spawn Python process
		const result = await runPythonScript(scriptPath, { nodes: safeNodes });

		// Return the result
		return NextResponse.json(result);

	} catch (error) {
		return serverError('cluster-analysis', error, 'Clustering failed');
	}
}

/**
 * Helper function to run Python script and return parsed JSON result
 */
function runPythonScript(scriptPath: string, inputData: any): Promise<any> {
	return new Promise((resolve, reject) => {
		// Use environment-based Python path for Docker/Render compatibility
		let pythonCommand = process.env.PYTHON_PATH || 'python3';
		
		// Fallback to venv if running locally (development)
		if (!process.env.PYTHON_PATH) {
			const projectRoot = process.cwd();
			const venvPaths = [
				path.join(projectRoot, 'backend', 'clustering', 'venv', 'Scripts', 'python.exe'), // Windows
				path.join(projectRoot, 'backend', 'clustering', 'venv', 'bin', 'python'), // Unix
			];

			for (const venvPath of venvPaths) {
				if (existsSync(venvPath)) {
					pythonCommand = venvPath;
					break;
				}
			}
		}

		debugLog(`[Cluster Analysis] Using Python: ${pythonCommand}`);

		const python = spawn(pythonCommand, [scriptPath]);

		let stdout = '';
		let stderr = '';
		let timedOut = false;

		// Kill the process if it runs too long
		const timer = setTimeout(() => {
			timedOut = true;
			python.kill('SIGKILL');
		}, LIMITS.PYTHON_TIMEOUT_MS);

		// Write input to stdin
		python.stdin.write(JSON.stringify(inputData));
		python.stdin.end();

		// Collect stdout
		python.stdout.on('data', (data) => {
			stdout += data.toString();
		});

		// Collect stderr
		python.stderr.on('data', (data) => {
			stderr += data.toString();
		});

		// Handle process completion
		python.on('close', (code) => {
			clearTimeout(timer);
			if (timedOut) {
				reject(new Error(`Python script timed out after ${LIMITS.PYTHON_TIMEOUT_MS}ms`));
				return;
			}
			if (code !== 0) {
				reject(new Error(`Python script failed with code ${code}: ${stderr}`));
				return;
			}

			try {
				const result = JSON.parse(stdout);
				
				if (result.error) {
					reject(new Error(result.error));
					return;
				}

				resolve(result);
			} catch (error) {
				reject(new Error(`Failed to parse Python output: ${stdout}`));
			}
		});

		// Handle errors
		python.on('error', (error) => {
			clearTimeout(timer);
			reject(new Error(`Failed to start Python process: ${error.message}`));
		});
	});
}
