"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SelectedNode {
  id: string
  label: string
  type: string
  content: string
}

interface ContextManagementProps {
  selectedNodes: SelectedNode[]
  characterCount: number
  isOverLimit: boolean
  onRemoveNode: (nodeId: string) => void
}

export function ContextManagement({
  selectedNodes,
  characterCount,
  isOverLimit,
  onRemoveNode,
}: ContextManagementProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="p-4 space-y-4">
      {/* Character Limit Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Context Usage:</span>
          <span className={`text-sm font-mono ${isOverLimit ? "text-red-600" : "text-gray-600"}`}>
            {characterCount.toLocaleString()} / 20,000 chars
          </span>
          {isOverLimit && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Over limit</span>
            </div>
          )}
        </div>
        <div className="w-32 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${isOverLimit ? "bg-red-500" : "bg-purple-500"}`}
            style={{ width: `${Math.min(100, (characterCount / 20000) * 100)}%` }}
          />
        </div>
      </div>

      {/* Selected Nodes Section */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between p-2 h-auto"
        >
          <span className="text-sm font-medium">Selected Nodes ({selectedNodes.length})</span>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        {isExpanded && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Node</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Type</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700">Chars</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedNodes.map((node) => (
                    <tr key={node.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-2 font-medium text-gray-900 truncate max-w-32">{node.label}</td>
                      <td className="py-2 px-2">
                        <Badge variant="outline" className="text-xs">
                          {node.type}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-right text-gray-600 font-mono text-xs">
                        {node.content?.length || 0}
                      </td>
                      <td className="py-2 px-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveNode(node.id)}
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
