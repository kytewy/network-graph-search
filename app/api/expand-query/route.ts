import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt: `You are helping expand a search query for a network graph visualization tool. The user is searching for nodes in a technical system architecture.

Original query: "${query}"

Expand this query by providing:
1. Related technical terms and synonyms
2. Common abbreviations and acronyms
3. Related system components
4. Alternative naming conventions

Return only the expanded search terms as a comma-separated list, no explanations. Focus on technical terms that would help find related nodes in a system architecture.

Example: If query is "database", return: "database, db, data store, storage, repository, persistence, sql, nosql, mongodb, postgresql, mysql, cache, redis"`,
    })

    return NextResponse.json({ expandedQuery: text.trim() })
  } catch (error) {
    console.error("Error expanding query:", error)
    return NextResponse.json({ error: "Failed to expand query" }, { status: 500 })
  }
}
