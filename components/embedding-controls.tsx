"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Zap, RefreshCw } from "lucide-react"
import { useNetworkStore } from "@/lib/stores/network-store"
import { useEmbeddingStore } from "@/lib/stores/embedding-store"

export function EmbeddingControls() {
  const nodes = useNetworkStore((state) => state.nodes)
  const { similarities, isGenerating, lastUpdated, setSimilarities, setIsGenerating, clearEmbeddings } =
    useEmbeddingStore()

  const [error, setError] = useState<string | null>(null)

  const generateEmbeddings = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      const response = await fetch("/api/calculate-similarity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate embeddings")
      }

      const { similarities: newSimilarities } = await response.json()
      setSimilarities(newSimilarities)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsGenerating(false)
    }
  }

  const similarityCount = Object.keys(similarities).length
  const hasEmbeddings = similarityCount > 0

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Semantic Similarity</h3>
        <Badge variant={hasEmbeddings ? "default" : "outline"}>{hasEmbeddings ? "Active" : "Inactive"}</Badge>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Button onClick={generateEmbeddings} disabled={isGenerating || nodes.length === 0} className="flex-1">
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Embeddings
              </>
            )}
          </Button>

          {hasEmbeddings && (
            <Button onClick={clearEmbeddings} variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

        {hasEmbeddings && (
          <div className="text-sm text-gray-600">
            <div>Nodes processed: {similarityCount}</div>
            {lastUpdated && <div>Updated: {lastUpdated.toLocaleTimeString()}</div>}
          </div>
        )}
      </div>
    </Card>
  )
}
