import { type NextRequest, NextResponse } from "next/server"

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))

  if (magnitudeA === 0 || magnitudeB === 0) return 0
  return dotProduct / (magnitudeA * magnitudeB)
}

export async function POST(request: NextRequest) {
  try {
    const { nodes } = await request.json()

    if (!nodes || !Array.isArray(nodes)) {
      return NextResponse.json({ error: "Invalid input: nodes array required" }, { status: 400 })
    }

    // Extract content from nodes
    const texts = nodes.map((node) => node.content || node.summary || node.label || "")

    // Generate embeddings
    const embeddingResponse = await fetch(`${request.nextUrl.origin}/api/generate-embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    })

    if (!embeddingResponse.ok) {
      throw new Error("Failed to generate embeddings")
    }

    const { embeddings } = await embeddingResponse.json()

    const similarities: { [key: string]: { [key: string]: number } } = {}

    for (let i = 0; i < nodes.length; i++) {
      similarities[nodes[i].id] = {}
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) {
          similarities[nodes[i].id][nodes[j].id] = 1.0
        } else {
          const similarity = cosineSimilarity(embeddings[i], embeddings[j])
          similarities[nodes[i].id][nodes[j].id] = Math.round(similarity * 100) / 100
        }
      }
    }

    return NextResponse.json({
      similarities,
      nodeCount: nodes.length,
      model: "sentence-transformers/all-MiniLM-L6-v2",
    })
  } catch (error) {
    console.error("Error calculating similarity:", error)
    return NextResponse.json({ error: "Failed to calculate similarity" }, { status: 500 })
  }
}
