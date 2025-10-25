'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Edit2, Check, XCircle } from 'lucide-react';
import { useContextStore } from '@/lib/stores/context-store';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getQuickPrompt, CHAT_PLACEHOLDERS } from '@/lib/prompts/analysis-prompts';

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

	// Use persistent store for conversations and context nodes
	const conversations = useContextStore((state) => state.chatConversations);
	const contextNodes = useContextStore((state) => state.contextNodes);
	const addChatConversation = useContextStore(
		(state) => state.addChatConversation
	);
	const updateChatConversation = useContextStore(
		(state) => state.updateChatConversation
	);
	const clearChatConversations = useContextStore(
		(state) => state.clearChatConversations
	);

	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [selectedPill, setSelectedPill] = useState<string | null>(null);
	const [placeholder, setPlaceholder] = useState<string>(
		CHAT_PLACEHOLDERS.default
	);
	const [isThinking, setIsThinking] = useState(false);
	const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
	const [editedPrompt, setEditedPrompt] = useState<string>('');

	const handleSendMessage = useCallback(
		async (message?: string, conversationIdToUpdate?: string) => {
			const promptToSend = message || chatInput;
			if (!promptToSend.trim()) return;

			setIsAnalyzing(true);
			
			// If updating an existing conversation, update it; otherwise create new
			if (conversationIdToUpdate) {
				updateChatConversation(conversationIdToUpdate, {
					prompt: promptToSend,
					response: 'Thinking...',
					timestamp: new Date(),
				});
			} else {
				const newConversation = {
					id: Date.now().toString(),
					prompt: promptToSend,
					response: 'Thinking...',
					timestamp: new Date(),
				};
				addChatConversation(newConversation);
				conversationIdToUpdate = newConversation.id;
			}

			try {
				// Prepare node data for analysis using context store nodes
				const nodeData = contextNodes.length > 0 
					? contextNodes.map((node) => ({
							id: node.id,
							name: node.label,
							type: node.type || 'document',
							text: node.fields?.full_text || node.summary || node.content || 'No content available',
							content: node.fields?.full_text || node.content,
							summary: node.summary,
							country: node.country,
							sourceType: (node as any).sourceType,
					  }))
					: []; // No fallback to sample nodes - use actual context

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
					updateChatConversation(conversationIdToUpdate, {
						response: summary,
					});
				} else {
					throw new Error(`API request failed: ${response.status}`);
				}
			} catch (error) {
				console.error('[v0] Error getting LLM response:', error);
				updateChatConversation(conversationIdToUpdate, {
					response:
						'Sorry, I encountered an error while analyzing the network data. Please try again.',
				});
			} finally {
				setIsAnalyzing(false);
				setChatInput('');
				setEditingConversationId(null);
				setEditedPrompt('');
			}
		},
		[
			chatInput,
			contextNodes,
			addChatConversation,
			updateChatConversation,
		]
	);

	// Listen for cluster analysis events from ClusteringInterface
	useEffect(() => {
		const handleChatSend = (e: CustomEvent) => {
			const { message, nodes } = e.detail;

			// Auto-send the message
			handleSendMessage(message);

			console.log('[ChatInterface] Received cluster analysis request:', {
				nodeCount: nodes?.length || 0,
			});
		};

		window.addEventListener('chat:send', handleChatSend as EventListener);
		return () => {
			window.removeEventListener('chat:send', handleChatSend as EventListener);
		};
	}, [handleSendMessage]);

	const handleFeedback = (conversationId: string, feedback: 'up' | 'down') => {
		updateChatConversation(conversationId, { feedback });
	};

	const handleDeleteConversation = (conversationId: string) => {
		// We'll need to add this to the store
		const remainingConversations = conversations.filter(
			(c) => c.id !== conversationId
		);
		clearChatConversations();
		remainingConversations.forEach((conv) => addChatConversation(conv));
	};

	const handleEditConversation = (conversationId: string, currentPrompt: string) => {
		setEditingConversationId(conversationId);
		setEditedPrompt(currentPrompt);
	};

	const handleSaveEdit = async (conversationId: string) => {
		if (!editedPrompt.trim()) return;
		await handleSendMessage(editedPrompt, conversationId);
	};

	const handleCancelEdit = () => {
		setEditingConversationId(null);
		setEditedPrompt('');
	};

	const handleCategoryClick = async (category: string) => {
		let prompt = '';
		const hasSelection = safeSelectedNodes.length > 0;
		
		switch (category) {
			case 'Summary':
				prompt = getQuickPrompt('summary', hasSelection);
				break;
			case 'Business Impact':
				prompt = getQuickPrompt('businessImpact', hasSelection);
				break;
		}
		setChatInput(prompt);
		await handleSendMessage(prompt);
	};

	return (
		<div className="space-y-6">
			<div className="border-t border-sidebar-border pt-6">
				{/* Header */}
				<div className="mb-6">
					<div className="flex items-center justify-between mb-2">
						<h4 className="text-xl font-semibold text-gray-900">
							Analysis & Insights
						</h4>
						<span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
							{safeSelectedNodes.length}{' '}
							{safeSelectedNodes.length === 1 ? 'node' : 'nodes'}
						</span>
					</div>
					<p className="text-sm text-gray-600 mb-6">
						Ask questions about your network nodes and get AI-powered insights
					</p>
				</div>
				<div className="flex flex-wrap gap-3 mb-6">
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setSelectedPill('Summary');
							const hasSelection = safeSelectedNodes.length > 0;
							const prompt = getQuickPrompt('summary', hasSelection);
							setChatInput(prompt);
							setPlaceholder(CHAT_PLACEHOLDERS.summary);
						}}
						className={`rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
							selectedPill === 'Summary'
								? 'bg-primary text-primary-foreground border-primary shadow-lg'
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
							const hasSelection = safeSelectedNodes.length > 0;
							const prompt = getQuickPrompt('businessImpact', hasSelection);
							setChatInput(prompt);
							setPlaceholder(CHAT_PLACEHOLDERS.businessImpact);
						}}
						className={`rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
							selectedPill === 'Business Impact'
								? 'bg-primary text-primary-foreground border-primary shadow-lg'
								: 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
						}`}
						disabled={isThinking}>
						Business Impact
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setSelectedPill('Citations');
							const hasSelection = safeSelectedNodes.length > 0;
							const prompt = getQuickPrompt('citations', hasSelection);
							setChatInput(prompt);
							setPlaceholder(CHAT_PLACEHOLDERS.citations);
						}}
						className={`rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
							selectedPill === 'Citations'
								? 'bg-primary text-primary-foreground border-primary shadow-lg'
								: 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
						}`}
						disabled={isThinking}>
						Citations
					</Button>
				</div>
				<div className="relative mb-6">
					<Textarea
						value={chatInput}
						onChange={(e) => setChatInput(e.target.value)}
						placeholder={placeholder}
						className="w-full bg-white border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 pr-16 min-h-[120px] resize-none rounded-xl text-base leading-relaxed transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10"
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
						className={`absolute right-3 bottom-3 h-10 w-10 p-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 ${
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
						{conversations
							.slice()
							.reverse()
							.map((conversation) => (
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
										{editingConversationId === conversation.id ? (
											<div className="space-y-2">
												<Textarea
													value={editedPrompt}
													onChange={(e) => setEditedPrompt(e.target.value)}
													className="w-full bg-white border-2 border-primary text-gray-900 min-h-[100px] resize-none rounded-lg text-sm leading-relaxed focus:border-primary focus:ring-2 focus:ring-primary/20"
													placeholder="Edit your prompt..."
													onKeyDown={(e) => {
														if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
															handleSaveEdit(conversation.id);
														}
														if (e.key === 'Escape') {
															handleCancelEdit();
														}
													}}
												/>
												<div className="flex gap-2">
													<Button
														size="sm"
														onClick={() => handleSaveEdit(conversation.id)}
														disabled={!editedPrompt.trim() || isAnalyzing}
														className="bg-primary hover:bg-primary/90 text-primary-foreground">
														<Check className="h-4 w-4 mr-1" />
														Save & Re-run
													</Button>
													<Button
														size="sm"
														variant="outline"
														onClick={handleCancelEdit}
														disabled={isAnalyzing}>
														<XCircle className="h-4 w-4 mr-1" />
														Cancel
													</Button>
												</div>
											</div>
										) : (
											<div className="prose prose-sm max-w-none text-gray-800 leading-relaxed rounded-lg p-4 bg-slate-50 border border-slate-200">
												<ReactMarkdown remarkPlugins={[remarkGfm]}>
													{conversation.prompt}
												</ReactMarkdown>
											</div>
										)}
									</div>

									{/* Analysis Section with Markdown */}
									<div className="mb-4">
										<div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
											<ReactMarkdown remarkPlugins={[remarkGfm]}>
												{conversation.response}
											</ReactMarkdown>
										</div>
									</div>

									{/* Action Toolbar */}
									<div className="flex items-center gap-2 pt-4 border-t border-gray-100">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleEditConversation(conversation.id, conversation.prompt)}
											disabled={isAnalyzing || editingConversationId !== null}
											className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors">
											<Edit2 className="w-4 h-4 mr-1" />
											{rightPanelExpanded && 'Edit & Re-run'}
										</Button>

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
