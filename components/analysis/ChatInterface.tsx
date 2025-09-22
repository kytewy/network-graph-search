import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

interface ChatInterfaceProps {
	safeSelectedNodes: string[];
	networkState: any;
	filterState: any;
	rightPanelExpanded: boolean;
	selectedNodesSummary: any;
}

export default function ChatInterface({
	safeSelectedNodes,
	networkState,
	filterState,
	rightPanelExpanded,
	selectedNodesSummary,
}: ChatInterfaceProps) {
	const [chatInput, setChatInput] = useState('');
	const [conversations, setConversations] = useState<
		Array<{
			id: string;
			prompt: string;
			response: string;
			timestamp: Date;
			feedback?: 'up' | 'down';
		}>
	>([]);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [selectedPill, setSelectedPill] = useState<string | null>(null);
	const [placeholder, setPlaceholder] = useState<string>(
		safeSelectedNodes.length > 0
			? 'Ask about AI regulations....'
			: 'Ask about AI regulations....'
	);
	const [isThinking, setIsThinking] = useState(false);

	const sampleNodes = [
		{
			id: '1',
			label: 'Node 1',
			summary: 'Summary of Node 1',
			content: 'Content of Node 1',
			type: 'Type A',
		},
		{
			id: '2',
			label: 'Node 2',
			summary: 'Summary of Node 2',
			content: 'Content of Node 2',
			type: 'Type B',
		},
	];

	const handleSendMessage = async (message?: string) => {
		const promptToSend = message || chatInput;
		if (!promptToSend.trim()) return;

		setIsAnalyzing(true);
		const newConversation = {
			id: Date.now().toString(),
			prompt: promptToSend,
			response: 'Thinking...',
			timestamp: new Date(),
		};

		setConversations((prev) => [...prev, newConversation]);

		try {
			// Prepare node data for analysis
			const nodeData =
				safeSelectedNodes.length > 0
					? safeSelectedNodes.map((node) => ({
							id: node,
							name: node,
							type: 'node',
							text: 'No description available',
					  }))
					: sampleNodes.map((node) => ({
							id: node.id,
							name: node.label,
							type: node.type,
							text: node.content || node.summary || 'No description available',
					  }));

			// Call the real LLM API
			const response = await fetch('/api/analyze-nodes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nodes: nodeData,
					analysisType: 'summary',
					customPrompt: promptToSend,
				}),
			});

			if (response.ok) {
				const { summary } = await response.json();
				setConversations((prev) =>
					prev.map((conv) =>
						conv.id === newConversation.id
							? {
									...conv,
									response: summary,
							  }
							: conv
					)
				);
			} else {
				throw new Error(`API request failed: ${response.status}`);
			}
		} catch (error) {
			console.error('[v0] Error getting LLM response:', error);
			setConversations((prev) =>
				prev.map((conv) =>
					conv.id === newConversation.id
						? {
								...conv,
								response:
									'Sorry, I encountered an error while analyzing the network data. Please try again.',
						  }
						: conv
				)
			);
		} finally {
			setIsAnalyzing(false);
			setChatInput('');
		}
	};

	const handleFeedback = (conversationId: string, feedback: 'up' | 'down') => {
		setConversations((prev) =>
			prev.map((conv) =>
				conv.id === conversationId ? { ...conv, feedback } : conv
			)
		);
	};

	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const handleRetry = (conversationId: string) => {
		const conversation = conversations.find(
			(conv) => conv.id === conversationId
		);
		if (conversation) {
			handleSendMessage(conversation.prompt);
		}
	};

	const setFeedback = (conversationId: string, feedback: 'up' | 'down') => {
		setConversations((prev) =>
			prev.map((conv) =>
				conv.id === conversationId ? { ...conv, feedback } : conv
			)
		);
	};

	const handleDeleteConversation = (conversationId: string) => {
		setConversations((prev) => prev.filter((c) => c.id !== conversationId));
	};

	const handleCategoryClick = async (category: string) => {
		let prompt = '';
		switch (category) {
			case 'Summary':
				prompt =
					safeSelectedNodes.length > 0
						? 'Provide a comprehensive summary of the selected network nodes, highlighting their key themes and relationships.'
						: 'Provide an overview of the entire network structure and main components.';
				break;
			case 'Business Impact':
				prompt =
					safeSelectedNodes.length > 0
						? 'Analyze the business impact and implications of the selected network nodes.'
						: 'Analyze the overall business impact represented in this network.';
				break;
		}
		setChatInput(prompt);
		await handleSendMessage(prompt);
	};

	return (
		<div className="space-y-6">
			<div className="border-t border-sidebar-border pt-6">
				<h4 className="text-xl font-semibold text-gray-900 mb-6">
					What would you like to know?
				</h4>

				<div className="flex flex-wrap gap-3 mb-6">
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setSelectedPill('Summary');
							const prompt =
								safeSelectedNodes.length > 0
									? 'Provide a comprehensive summary of the selected network nodes, highlighting their key themes and relationships.'
									: 'Provide an overview of the entire network structure and main components.';
							setChatInput(prompt);
							setPlaceholder(
								'What key points should I summarize from the network?'
							);
						}}
						className={`rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
							selectedPill === 'Summary'
								? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-lg shadow-purple-500/25'
								: 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
						}`}
						disabled={isThinking}>
						Summary
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setSelectedPill('Business Impact');
							const prompt =
								safeSelectedNodes.length > 0
									? 'Analyze the business impact and implications of the selected network nodes.'
									: 'Analyze the overall business impact represented in this network.';
							setChatInput(prompt);
							setPlaceholder(
								'How might this network configuration affect business operations?'
							);
						}}
						className={`rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
							selectedPill === 'Business Impact'
								? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-lg shadow-purple-500/25'
								: 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
						}`}
						disabled={isThinking}>
						Business Impact
					</Button>
				</div>

				<div className="relative mb-6">
					<Textarea
						value={chatInput}
						onChange={(e) => setChatInput(e.target.value)}
						placeholder={placeholder}
						className="w-full bg-white border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 pr-16 min-h-[120px] resize-none rounded-xl text-base leading-relaxed transition-all duration-200 focus:border-[#7c3aed] focus:ring-4 focus:ring-purple-500/10"
						onKeyDown={(e) => {
							if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
								handleSendMessage();
							}
							if (e.key === 'Escape' && isThinking) {
								setIsThinking(false);
							}
						}}
					/>
					<Button
						size="sm"
						className={`absolute right-3 bottom-3 h-10 w-10 p-0 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 ${
							isThinking ? 'animate-spin' : 'hover:rotate-12'
						}`}
						onClick={() => handleSendMessage()}
						disabled={!chatInput.trim()}>
						{isThinking ? (
							<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
						) : (
							'→'
						)}
					</Button>
				</div>

				{isThinking && (
					<div className="flex justify-start mb-4">
						<div className="bg-sidebar-accent/10 rounded-xl border border-sidebar-border shadow-sm px-4 py-3 max-w-xs">
							<div className="flex items-center gap-1">
								<span className="text-sidebar-foreground/70 text-sm italic">
									Thinking
								</span>
								<span className="text-sidebar-foreground/70 text-sm">
									<span className="inline-block animate-[dots_1.5s_ease-in-out_infinite]">
										...
									</span>
								</span>
							</div>
						</div>
					</div>
				)}

				{conversations.length > 0 && (
					<div className="space-y-6">
						{/* Updated analysis conversation buttons to use consistent purple theme */}
						{conversations
							.slice()
							.reverse()
							.map((conversation, index) => (
								<div key={conversation.id} className="space-y-4">
									<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative">
										<button
											onClick={() => handleDeleteConversation(conversation.id)}
											className="absolute top-3 right-3 p-1 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/20 rounded transition-colors">
											<X className="h-4 w-4" />
										</button>

										{/* Time */}
										<div className="mb-4">
											<span className="text-xs text-gray-500 font-medium">
												Time: {conversation.timestamp.toLocaleTimeString()}
											</span>
										</div>

										{/* Prompt Section */}
										<div className="mb-4">
											<div className="text-gray-800 leading-relaxed text-base rounded-lg p-3 bg-slate-100">
												"{conversation.prompt}"
											</div>
										</div>

										{/* Analysis Section */}
										<div className="mb-4">
											<div className="text-gray-800 leading-relaxed text-base">
												{conversation.response}
											</div>
										</div>

										{/* Action Toolbar */}
										<div className="flex items-center gap-2 pt-4 border-t border-gray-100">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => {
													navigator.clipboard.writeText(
														`Prompt: ${conversation.prompt}\n\nAnalysis: ${conversation.response}`
													);
												}}
												className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors">
												<svg
													className="w-4 h-4 mr-1"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24">
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 002 2v8a2 2 0 002 2z"
													/>
												</svg>
												{rightPanelExpanded && 'Copy'}
											</Button>

											<Button
												variant="ghost"
												size="sm"
												onClick={() => {
													const timestamp = new Date().toLocaleString();
													const filterBreadcrumb = [
														filterState.selectedContinents?.length > 0 &&
															`Continents: ${filterState.selectedContinents.join(
																', '
															)}`,
														filterState.selectedCountries?.length > 0 &&
															`Countries: ${filterState.selectedCountries.join(
																', '
															)}`,
														filterState.selectedSourceTypes?.length > 0 &&
															`Source Types: ${filterState.selectedSourceTypes.join(
																', '
															)}`,
														filterState.searchTerm &&
															`Search: "${filterState.searchTerm}"`,
														filterState.selectedSimilarityRange?.length > 0 &&
															`Similarity Range: ${filterState.selectedSimilarityRange[0]}% - ${filterState.selectedSimilarityRange[1]}%`,
													]
														.filter(Boolean)
														.join(' | ');

													const selectedNodeIds = safeSelectedNodes.join(', ');

													const exportContent = [
														`Export Date: ${timestamp}`,
														``,
														`Prompt: ${conversation.prompt}`,
														``,
														`Active Filters: ${filterBreadcrumb || 'None'}`,
														``,
														`Selected Node IDs: ${selectedNodeIds || 'None'}`,
														``,
														`Analysis:`,
														conversation.response,
													].join('\n');

													const blob = new Blob([exportContent], {
														type: 'text/plain',
													});
													const url = URL.createObjectURL(blob);
													const a = document.createElement('a');
													a.href = url;
													a.download = `network-analysis-${Date.now()}.txt`;
													document.body.appendChild(a);
													a.click();
													document.body.removeChild(a);
													URL.revokeObjectURL(url);
												}}
												className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors">
												<svg
													className="w-4 h-4 mr-1"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24">
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
													/>
												</svg>
												{rightPanelExpanded && 'Download'}
											</Button>

											<div className="flex items-center gap-1 ml-2">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleFeedback(conversation.id, 'up')}
													className={
														conversation.feedback === 'up'
															? 'text-green-600 bg-green-50 hover:bg-green-100'
															: 'text-gray-600 hover:text-green-600 hover:bg-green-50'
													}>
													<svg
														className="w-4 h-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24">
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
														/>
													</svg>
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														handleFeedback(conversation.id, 'down')
													}
													className={
														conversation.feedback === 'down'
															? 'text-red-600 bg-red-50 hover:bg-red-100'
															: 'text-gray-600 hover:text-red-600 hover:bg-red-50'
													}>
													<svg
														className="w-4 h-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24">
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M10 14H5.764a2 2 0 01-1.789-2.894l3.5-7A2 2 0 019.263 3h4.017c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 11V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
														/>
													</svg>
												</Button>
											</div>
										</div>
									</div>
								</div>
							))}
					</div>
				)}
			</div>
		</div>
	);
}
