"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Copy, ThumbsUp, X, ChevronDown, ChevronRight } from "lucide-react"
import type { Conversation } from "@/hooks/use-analysis-chat"

interface ConversationHistoryProps {
  conversations: Conversation[]
  onFeedback: (id: string, feedback: "up" | "down") => void
  onDelete: (id: string) => void
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({ conversations, onFeedback, onDelete }) => {
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedConversations((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const copyConversation = (conversation: Conversation) => {
    const text = `Prompt: ${conversation.prompt}\n\nResponse: ${conversation.response}`
    navigator.clipboard.writeText(text)
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(timestamp)
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No conversations yet. Start by asking a question or using a preset prompt.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => {
        const isExpanded = expandedConversations.has(conversation.id)

        return (
          <Card key={conversation.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(conversation.id)}
                    className="p-1 h-auto"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  <span className="text-sm text-gray-600">{formatTimestamp(conversation.timestamp)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(conversation.id)}
                  className="p-1 h-auto text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm font-medium text-gray-900 line-clamp-2">{conversation.prompt}</div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Prompt Section */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Prompt</div>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{conversation.prompt}</div>
                  </div>

                  {/* Response Section */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Response</div>
                    <div className="text-sm text-gray-900 bg-purple-50 p-3 rounded-md">
                      {conversation.response || "No response yet..."}
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyConversation(conversation)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFeedback(conversation.id, "up")}
                        className={`${
                          conversation.feedback === "up"
                            ? "text-purple-600 bg-purple-50"
                            : "text-gray-600 hover:text-purple-600"
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
