"use client"

import { useState, useCallback } from "react"

export interface Conversation {
  id: string
  prompt: string
  response: string
  timestamp: Date
  feedback?: "up" | "down"
}

export interface UseAnalysisChatReturn {
  conversations: Conversation[]
  isAnalyzing: boolean
  chatInput: string
  setChatInput: (input: string) => void
  sendMessage: (message: string) => Promise<void>
  handleFeedback: (id: string, feedback: "up" | "down") => void
  handleDeleteConversation: (id: string) => void
  presetPrompts: { label: string; prompt: string }[]
}

export const useAnalysisChat = (): UseAnalysisChatReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [chatInput, setChatInput] = useState("")

  const presetPrompts = [
    {
      label: "Summary",
      prompt: "Provide a comprehensive summary of the selected nodes and their relationships.",
    },
    {
      label: "Business Impact",
      prompt: "Analyze the business impact and strategic implications of these components.",
    },
    {
      label: "Upcoming Changes",
      prompt: "Identify potential upcoming changes and recommendations for these systems.",
    },
  ]

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isAnalyzing) return

      setIsAnalyzing(true)
      setChatInput("")

      const newConversation: Conversation = {
        id: Date.now().toString(),
        prompt: message,
        response: "",
        timestamp: new Date(),
      }

      setConversations((prev) => [...prev, newConversation])

      try {
        // Simulate API call - replace with actual API integration
        await new Promise((resolve) => setTimeout(resolve, 2000))

        const mockResponse = `Based on your query "${message}", here's a detailed analysis of the selected components. This response demonstrates the chat functionality with proper loading states and conversation management.`

        setConversations((prev) =>
          prev.map((conv) => (conv.id === newConversation.id ? { ...conv, response: mockResponse } : conv)),
        )
      } catch (error) {
        console.error("Error sending message:", error)
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === newConversation.id
              ? { ...conv, response: "Sorry, there was an error processing your request." }
              : conv,
          ),
        )
      } finally {
        setIsAnalyzing(false)
      }
    },
    [isAnalyzing],
  )

  const handleFeedback = useCallback((id: string, feedback: "up" | "down") => {
    setConversations((prev) => prev.map((conv) => (conv.id === id ? { ...conv, feedback } : conv)))
  }, [])

  const handleDeleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id))
  }, [])

  return {
    conversations,
    isAnalyzing,
    chatInput,
    setChatInput,
    sendMessage,
    handleFeedback,
    handleDeleteConversation,
    presetPrompts,
  }
}
