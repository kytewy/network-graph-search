import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { nodes, analysisType, customPrompt } = await request.json()

    if (!nodes || !Array.isArray(nodes)) {
      return NextResponse.json({ error: "Nodes array is required" }, { status: 400 })
    }

    const nodeDescriptions = nodes
      .map((node) => `${node.name} (${node.type}): ${node.text || "No description"}`)
      .join("\n")

    let prompt = ""

    if (customPrompt) {
      prompt = `Based on this network data, please respond to the following question or request:

Question/Request: ${customPrompt}

Network Nodes:
${nodeDescriptions}

Please provide a comprehensive and helpful response based on the network data provided.`
    } else if (analysisType === "summary") {
      prompt = `Analyze these network nodes and provide a comprehensive summary:

${nodeDescriptions}

Provide a clear, technical summary that covers:
1. Overall system purpose and architecture
2. Key components and their roles
3. Main functional areas represented
4. Notable patterns or relationships

Keep it concise but informative, focusing on the technical aspects.`
    } else if (analysisType === "themes") {
      prompt = `Analyze these network nodes and identify key themes and patterns:

${nodeDescriptions}

Identify 3-5 main themes/categories and for each theme provide:
1. Theme name
2. Brief description
3. Which nodes belong to this theme
4. Why they're grouped together

Format as JSON with this structure:
{
  "themes": [
    {
      "name": "Theme Name",
      "description": "Brief description",
      "nodeIds": ["node1", "node2"],
      "reasoning": "Why these nodes are grouped"
    }
  ]
}`
    }

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
    })

    if (analysisType === "themes") {
      try {
        const analysis = JSON.parse(text)
        return NextResponse.json(analysis)
      } catch {
        return NextResponse.json({
          themes: [
            {
              name: "Analysis",
              description: text,
              nodeIds: nodes.map((n) => n.id),
              reasoning: "LLM analysis",
            },
          ],
        })
      }
    }

    return NextResponse.json({ summary: text.trim() })
  } catch (error) {
    console.error("Error analyzing nodes:", error)
    return NextResponse.json({ error: "Failed to analyze nodes" }, { status: 500 })
  }
}
