"use client"

import { useState, useMemo, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Clock, Hash } from "lucide-react"

// Sample data structure as specified
const sampleData = [
  {
    id: "1",
    title: "Machine Learning Pipeline",
    summary: "ML pipeline for model training and inference with automated MLOps workflows",
    content:
      "Comprehensive machine learning pipeline that handles data preprocessing, model training, validation, and deployment with continuous integration and monitoring capabilities for production environments.",
    category: "AI/ML",
  },
  {
    id: "2",
    title: "Data Analytics Dashboard",
    summary: "Real-time analytics dashboard for business intelligence",
    content:
      "Interactive dashboard providing real-time insights into business metrics, KPIs, and performance indicators with customizable visualizations and automated reporting features.",
    category: "Analytics",
  },
  {
    id: "3",
    title: "API Gateway Service",
    summary: "Microservices API gateway with load balancing and authentication",
    content:
      "Scalable API gateway that manages microservices communication, handles authentication, rate limiting, load balancing, and provides comprehensive logging and monitoring.",
    category: "Infrastructure",
  },
  {
    id: "4",
    title: "Database Optimization Engine",
    summary: "Automated database performance optimization and query tuning",
    content:
      "Advanced database optimization engine that analyzes query performance, suggests index improvements, and automatically tunes database configurations for optimal performance.",
    category: "Database",
  },
  {
    id: "5",
    title: "Cloud Security Framework",
    summary: "Enterprise cloud security framework with compliance monitoring",
    content:
      "Comprehensive security framework for cloud environments including threat detection, vulnerability assessment, compliance monitoring, and automated security policy enforcement.",
    category: "Security",
  },
  {
    id: "6",
    title: "DevOps Automation Platform",
    summary: "CI/CD automation platform for streamlined software delivery",
    content:
      "Complete DevOps automation platform that streamlines continuous integration, deployment pipelines, infrastructure as code, and provides comprehensive monitoring and alerting.",
    category: "DevOps",
  },
  {
    id: "7",
    title: "Real-time Data Processing",
    summary: "Stream processing engine for real-time data analytics",
    content:
      "High-performance stream processing engine that handles real-time data ingestion, transformation, and analytics with support for complex event processing and machine learning integration.",
    category: "Data Processing",
  },
  {
    id: "8",
    title: "Mobile App Backend",
    summary: "Scalable backend services for mobile applications",
    content:
      "Robust backend infrastructure for mobile applications including user management, push notifications, offline synchronization, and real-time messaging capabilities.",
    category: "Mobile",
  },
  {
    id: "9",
    title: "Blockchain Integration Layer",
    summary: "Enterprise blockchain integration with smart contract management",
    content:
      "Enterprise-grade blockchain integration layer that provides smart contract deployment, transaction management, and seamless integration with existing business systems.",
    category: "Blockchain",
  },
  {
    id: "10",
    title: "AI-Powered Recommendation System",
    summary: "Machine learning recommendation engine for personalized content",
    content:
      "Advanced recommendation system using collaborative filtering, content-based filtering, and deep learning algorithms to provide personalized recommendations across various domains.",
    category: "AI/ML",
  },
]

// Stop words list as specified
const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
])

interface SearchResult {
  id: string
  title: string
  summary: string
  content: string
  category: string
  similarity: number
  exactMatch: boolean
  wordOverlap: number
}

interface ProcessedDocument {
  id: string
  title: string
  summary: string
  content: string
  category: string
  processedText: string[]
  tfidfVector: Record<string, number>
  combinedText: string
}

interface SearchMetrics {
  searchTime: number
  resultsCount: number
  totalDocuments: number
}

const preprocessText = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .split(" ")
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word))
}

const calculateTFIDF = (documents: ProcessedDocument[], vocabulary: string[]): ProcessedDocument[] => {
  const docCount = documents.length
  const idf: Record<string, number> = {}

  // Calculate IDF for each term
  vocabulary.forEach((term) => {
    const docsWithTerm = documents.filter((doc) => doc.processedText.includes(term)).length
    idf[term] = Math.log(docCount / (docsWithTerm || 1))
  })

  // Calculate TF-IDF vectors for each document
  return documents.map((doc) => {
    const termFreq: Record<string, number> = {}
    const totalTerms = doc.processedText.length

    // Calculate term frequencies
    doc.processedText.forEach((term) => {
      termFreq[term] = (termFreq[term] || 0) + 1
    })

    // Calculate TF-IDF vector
    const tfidfVector: Record<string, number> = {}
    vocabulary.forEach((term) => {
      const tf = (termFreq[term] || 0) / totalTerms
      tfidfVector[term] = tf * idf[term]
    })

    return { ...doc, tfidfVector }
  })
}

const cosineSimilarity = (vec1: Record<string, number>, vec2: Record<string, number>): number => {
  const keys = new Set([...Object.keys(vec1), ...Object.keys(vec2)])
  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  keys.forEach((key) => {
    const val1 = vec1[key] || 0
    const val2 = vec2[key] || 0
    dotProduct += val1 * val2
    norm1 += val1 * val1
    norm2 += val2 * val2
  })

  const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2)
  return magnitude === 0 ? 0 : dotProduct / magnitude
}

export default function TFIDFSearch() {
  const [query, setQuery] = useState("")
  const [searchMetrics, setSearchMetrics] = useState<SearchMetrics>({
    searchTime: 0,
    resultsCount: 0,
    totalDocuments: sampleData.length,
  })

  const processedDocuments = useMemo(() => {
    console.log("[v0] Processing documents...")
    const startTime = performance.now()

    // Process all documents
    const processed: ProcessedDocument[] = sampleData.map((doc) => {
      const combinedText = `${doc.title} ${doc.summary} ${doc.content}`
      const processedText = preprocessText(combinedText)

      return {
        ...doc,
        processedText,
        tfidfVector: {},
        combinedText,
      }
    })

    // Build global vocabulary
    const vocabulary = Array.from(new Set(processed.flatMap((doc) => doc.processedText)))

    const documentsWithTFIDF = calculateTFIDF(processed, vocabulary)

    const endTime = performance.now()
    console.log(`[v0] Document processing completed in ${endTime - startTime}ms`)

    return { documents: documentsWithTFIDF, vocabulary }
  }, [])

  const searchDocuments = useCallback(
    (searchQuery: string): SearchResult[] => {
      if (!searchQuery.trim()) return []

      const startTime = performance.now()
      const processedQuery = preprocessText(searchQuery)
      const queryLower = searchQuery.toLowerCase()

      // Create query TF-IDF vector
      const queryTermFreq: Record<string, number> = {}
      processedQuery.forEach((term) => {
        queryTermFreq[term] = (queryTermFreq[term] || 0) + 1
      })

      const queryTFIDF: Record<string, number> = {}
      processedDocuments.vocabulary.forEach((term) => {
        const tf = (queryTermFreq[term] || 0) / processedQuery.length
        queryTFIDF[term] = tf // Simplified for query
      })

      const results: SearchResult[] = processedDocuments.documents.map((doc) => {
        // 1. Exact substring matching (40% weight)
        const exactMatch = doc.combinedText.toLowerCase().includes(queryLower)
        const exactScore = exactMatch ? 1 : 0

        // 2. TF-IDF cosine similarity (40% weight)
        const tfidfScore = cosineSimilarity(queryTFIDF, doc.tfidfVector)

        // 3. Word overlap (20% weight)
        const queryWords = new Set(processedQuery)
        const docWords = new Set(doc.processedText)
        const intersection = new Set([...queryWords].filter((word) => docWords.has(word)))
        const union = new Set([...queryWords, ...docWords])
        const overlapScore = union.size > 0 ? intersection.size / union.size : 0

        // Combined similarity score
        const similarity = exactScore * 0.4 + tfidfScore * 0.4 + overlapScore * 0.2

        return {
          id: doc.id,
          title: doc.title,
          summary: doc.summary,
          content: doc.content,
          category: doc.category,
          similarity: similarity * 100, // Convert to percentage
          exactMatch,
          wordOverlap: intersection.size,
        }
      })

      // Filter and sort results
      const filteredResults = results
        .filter((result) => result.similarity >= 5) // 5% threshold
        .sort((a, b) => b.similarity - a.similarity)

      const endTime = performance.now()
      setSearchMetrics({
        searchTime: endTime - startTime,
        resultsCount: filteredResults.length,
        totalDocuments: sampleData.length,
      })

      return filteredResults
    },
    [processedDocuments],
  )

  const results = useMemo(() => searchDocuments(query), [query, searchDocuments])

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            TF-IDF Search Engine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search documents... (e.g., 'machine learning pipeline', 'ML training', 'analytics dashboard')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {query && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{searchMetrics.searchTime.toFixed(2)}ms</span>
              </div>
              <div className="flex items-center gap-1">
                <Hash className="h-4 w-4" />
                <span>{searchMetrics.resultsCount} results</span>
              </div>
              <span>({searchMetrics.totalDocuments} total documents)</span>
            </div>
          )}
        </CardContent>
      </Card>

      {query && (
        <div className="space-y-4">
          {results.length > 0 ? (
            results.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{result.summary}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant="outline" className="text-xs">
                        {result.category}
                      </Badge>
                      <Badge
                        variant={
                          result.similarity >= 80 ? "default" : result.similarity >= 50 ? "secondary" : "outline"
                        }
                        className="text-xs font-mono"
                      >
                        {result.similarity.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm line-clamp-2 mb-2">{result.content}</p>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {result.exactMatch && (
                      <Badge variant="outline" className="text-xs">
                        Exact Match
                      </Badge>
                    )}
                    {result.wordOverlap > 0 && (
                      <span>
                        {result.wordOverlap} word{result.wordOverlap !== 1 ? "s" : ""} overlap
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No results found above 5% similarity threshold.
                <br />
                Try different search terms or check your spelling.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!query && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">Start typing to search documents</p>
            <p className="text-sm">Try searching for "machine learning", "analytics dashboard", or "API gateway"</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export { TFIDFSearch }
