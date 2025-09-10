"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"

interface ChatInterfaceProps {
  chatInput: string
  setChatInput: (input: string) => void
  onSendMessage: (message: string) => void
  isAnalyzing: boolean
  presetPrompts: { label: string; prompt: string }[]
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatInput,
  setChatInput,
  onSendMessage,
  isAnalyzing,
  presetPrompts,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.max(120, textarea.scrollHeight) + "px"
    }
  }, [chatInput])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    } else if (e.key === "Escape") {
      setChatInput("")
    }
  }

  const handleSend = () => {
    if (chatInput.trim() && !isAnalyzing) {
      onSendMessage(chatInput.trim())
    }
  }

  const handlePresetClick = (prompt: string) => {
    setChatInput(prompt)
    onSendMessage(prompt)
  }

  return (
    <div className="space-y-4">
      {/* Preset Prompts */}
      <div className="flex flex-wrap gap-2">
        {presetPrompts.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isAnalyzing}
            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-colors"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Chat Input */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about the selected nodes... (Cmd/Ctrl + Enter to send)"
          disabled={isAnalyzing}
          className="min-h-[120px] pr-12 resize-none focus:ring-purple-500 focus:border-purple-500"
        />
        <Button
          onClick={handleSend}
          disabled={!chatInput.trim() || isAnalyzing}
          size="sm"
          className="absolute bottom-3 right-3 bg-purple-600 hover:bg-purple-700 text-white transition-colors"
        >
          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {/* Thinking Indicator */}
      {isAnalyzing && (
        <div className="flex items-center gap-2 text-purple-600">
          <span>Thinking</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}
    </div>
  )
}
