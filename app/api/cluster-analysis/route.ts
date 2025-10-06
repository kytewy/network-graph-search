import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface NodeInput {
	id: string;
	label: string;
	content: string;
	type: string;
}

interface ClusterAnalysisRequest {
	nodes: NodeInput[];
}

/**
 * POST /api/cluster-analysis
 * 
 * Accepts an array of nodes and returns cluster assignments using BERTopic.
 * Features:
 * - Step 1.2: ✅ Real BERTopic clustering with semantic embeddings
 * - Step 1.3: ✅ GPT-4 interpretation (when OPENAI_API_KEY is set)
 */
export async function POST(request: NextRequest) {
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

		// Path to BERTopic Python script (in backend/clustering/)
		const scriptPath = path.join(process.cwd(), 'backend', 'clustering', 'cli.py');

		// Spawn Python process
		const result = await runPythonScript(scriptPath, { nodes });

		// Return the result
		return NextResponse.json(result);

	} catch (error) {
		console.error('[Cluster Analysis API] Error:', error);
		return NextResponse.json(
			{ 
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}

/**
 * Helper function to run Python script and return parsed JSON result
 */
function runPythonScript(scriptPath: string, inputData: any): Promise<any> {
	return new Promise((resolve, reject) => {
		// Try to use venv Python first (Windows: venv/Scripts/python.exe, Unix: venv/bin/python)
		const projectRoot = process.cwd();
		const venvPaths = [
			path.join(projectRoot, 'backend', 'clustering', 'venv', 'Scripts', 'python.exe'), // Windows
			path.join(projectRoot, 'backend', 'clustering', 'venv', 'bin', 'python'), // Unix
		];

		let pythonCommand = 'python'; // Fallback to system Python
		for (const venvPath of venvPaths) {
			if (existsSync(venvPath)) {
				pythonCommand = venvPath;
				break;
			}
		}

		const python = spawn(pythonCommand, [scriptPath]);

		let stdout = '';
		let stderr = '';

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
			reject(new Error(`Failed to start Python process: ${error.message}`));
		});
	});
}
