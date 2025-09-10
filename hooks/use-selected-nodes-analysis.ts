"use client"

import { useMemo } from "react"

// TypeScript interfaces
export interface NodeStatistics {
  totalNodes: number
  nodeTypes: Record<string, number>
  averageSize: number
  totalConnections: number
  characterCount: number
  isOverLimit: boolean
}

export interface WordFrequency {
  word: string
  frequency: number
}

export interface ThemeMatch {
  nodeId: string
  nodeName: string
  relevanceScore: number
  matchedKeywords: string[]
}

export interface ThemeAnalysis {
  name: string
  description: string
  keywords: string[]
  matches: ThemeMatch[]
  confidence: number
}

export interface AnalysisData {
  statistics: NodeStatistics
  commonWords: WordFrequency[]
  themes: ThemeAnalysis[]
}

interface SelectedNode {
  id: string
  label: string
  type: string
  size: number
  content: string
  summary?: string
}

const PREDEFINED_THEMES = [
  {
    name: "Data Processing",
    description: "Systems and components involved in data transformation, analysis, and processing workflows",
    keywords: [
      "data",
      "processing",
      "transform",
      "analysis",
      "pipeline",
      "etl",
      "batch",
      "stream",
      "analytics",
      "compute",
    ],
  },
  {
    name: "Security",
    description: "Security-related components including authentication, authorization, and protection mechanisms",
    keywords: [
      "security",
      "auth",
      "authentication",
      "authorization",
      "encryption",
      "firewall",
      "protection",
      "secure",
      "identity",
      "access",
    ],
  },
  {
    name: "Storage & Database",
    description: "Data storage solutions, databases, and persistent storage systems",
    keywords: ["database", "storage", "cache", "redis", "sql", "nosql", "persistent", "repository", "data", "store"],
  },
  {
    name: "Communication",
    description: "Messaging, APIs, and communication protocols between systems",
    keywords: [
      "api",
      "messaging",
      "communication",
      "protocol",
      "http",
      "rest",
      "graphql",
      "websocket",
      "queue",
      "broker",
    ],
  },
  {
    name: "User Interface",
    description: "Frontend components, user experience, and presentation layers",
    keywords: ["ui", "frontend", "interface", "user", "dashboard", "portal", "web", "mobile", "client", "presentation"],
  },
  {
    name: "Infrastructure",
    description: "System infrastructure, deployment, and operational components",
    keywords: [
      "infrastructure",
      "deployment",
      "server",
      "cloud",
      "container",
      "kubernetes",
      "docker",
      "network",
      "load",
      "balancer",
    ],
  },
  {
    name: "Integration",
    description: "System integration points, connectors, and middleware components",
    keywords: [
      "integration",
      "connector",
      "middleware",
      "gateway",
      "proxy",
      "adapter",
      "bridge",
      "sync",
      "webhook",
      "service",
    ],
  },
  {
    name: "Monitoring & Analytics",
    description: "Observability, monitoring, logging, and performance tracking systems",
    keywords: [
      "monitoring",
      "analytics",
      "logging",
      "metrics",
      "observability",
      "tracking",
      "performance",
      "alerting",
      "dashboard",
      "reporting",
    ],
  },
]

const CHARACTER_LIMIT = 20000

export function useSelectedNodesAnalysis(selectedNodes: SelectedNode[], deselectedNodeTypes: string[]): AnalysisData {
  return useMemo(() => {
    // Filter out deselected node types
    const filteredNodes = selectedNodes.filter((node) => !deselectedNodeTypes.includes(node.type))

    // Calculate statistics
    const statistics: NodeStatistics = {
      totalNodes: filteredNodes.length,
      nodeTypes: filteredNodes.reduce(
        (acc, node) => {
          acc[node.type] = (acc[node.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
      averageSize:
        filteredNodes.length > 0 ? filteredNodes.reduce((sum, node) => sum + node.size, 0) / filteredNodes.length : 0,
      totalConnections: filteredNodes.reduce((sum, node) => sum + (node.size || 0), 0),
      characterCount: filteredNodes.reduce((sum, node) => sum + (node.content?.length || 0), 0),
      isOverLimit: false,
    }

    statistics.isOverLimit = statistics.characterCount > CHARACTER_LIMIT

    // Extract common words
    const allText = filteredNodes
      .map((node) => `${node.label} ${node.content || ""} ${node.summary || ""}`)
      .join(" ")
      .toLowerCase()

    const words = allText
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 3)
      .filter(
        (word) =>
          ![
            "the",
            "and",
            "for",
            "are",
            "but",
            "not",
            "you",
            "all",
            "can",
            "had",
            "her",
            "was",
            "one",
            "our",
            "out",
            "day",
            "get",
            "has",
            "him",
            "his",
            "how",
            "its",
            "may",
            "new",
            "now",
            "old",
            "see",
            "two",
            "who",
            "boy",
            "did",
            "she",
            "use",
            "her",
            "way",
            "many",
            "then",
            "them",
            "well",
            "were",
          ].includes(word),
      )

    const wordFrequency: Record<string, number> = {}
    words.forEach((word) => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1
    })

    const commonWords: WordFrequency[] = Object.entries(wordFrequency)
      .map(([word, frequency]) => ({ word, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20)

    // Theme analysis
    const themes: ThemeAnalysis[] = PREDEFINED_THEMES.map((theme) => {
      const matches: ThemeMatch[] = filteredNodes
        .map((node) => {
          const nodeText = `${node.label} ${node.content || ""} ${node.summary || ""}`.toLowerCase()
          const matchedKeywords = theme.keywords.filter((keyword) => nodeText.includes(keyword.toLowerCase()))

          const relevanceScore = matchedKeywords.length > 0 ? (matchedKeywords.length / theme.keywords.length) * 100 : 0

          return {
            nodeId: node.id,
            nodeName: node.label,
            relevanceScore,
            matchedKeywords,
          }
        })
        .filter((match) => match.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)

      const confidence =
        matches.length > 0
          ? Math.min(100, matches.reduce((sum, match) => sum + match.relevanceScore, 0) / matches.length)
          : 0

      return {
        ...theme,
        matches,
        confidence,
      }
    }).filter((theme) => theme.matches.length > 0)

    return {
      statistics,
      commonWords,
      themes,
    }
  }, [selectedNodes, deselectedNodeTypes])
}
