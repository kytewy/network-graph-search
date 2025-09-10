"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, ThumbsDown, Copy } from "lucide-react"

interface AnalysisProps {
  nodes: any[]
  textAnalysis: {
    commonWords: { word: string; count: number }[]
    themes: string[]
    summary: string
  }
  themeAnalysis: {
    themes: Array<{
      name: string
      nodes: Array<{
        id: string
        label: string
        type: string
        relevanceScore: number
        matchedKeywords: string[]
      }>
      score: number
    }>
  }
}

type AnalysisType = "summary" | "business" | "themes"

export default function Analysis({ nodes, textAnalysis, themeAnalysis }: AnalysisProps) {
  const [activeTab, setActiveTab] = useState<AnalysisType>("summary")
  const [showResults, setShowResults] = useState<{ [key in AnalysisType]: boolean }>({
    summary: false,
    business: false,
    themes: false,
  })
  const [loading, setLoading] = useState<{ [key in AnalysisType]: boolean }>({
    summary: false,
    business: false,
    themes: false,
  })

  const [editingMethodology, setEditingMethodology] = useState<{ [key in AnalysisType]: boolean }>({
    summary: false,
    business: false,
    themes: false,
  })

  const [prompts, setPrompts] = useState({
    summary:
      "Analyze the selected network nodes and provide a comprehensive summary of their collective purpose, identifying key themes and relationships between components.",
    business:
      "Evaluate the business impact of the selected network components, considering operational dependencies, risk factors, and strategic importance to overall system performance.",
    themes:
      "Identify and categorize the key functional themes present in the selected network nodes, grouping related components and highlighting their primary purposes and relationships.",
  })

  const [feedback, setFeedback] = useState<{ [key in AnalysisType]: "up" | "down" | null }>({
    summary: null,
    business: null,
    themes: null,
  })
  const [copyFeedback, setCopyFeedback] = useState<{ [key in AnalysisType]: boolean }>({
    summary: false,
    business: false,
    themes: false,
  })

  const analysisTypes = {
    summary: { label: "Summary" },
    business: { label: "Business Impact" },
    themes: { label: "Key Themes" },
  }

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return null
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const handleFeedback = (type: "up" | "down") => {
    setFeedback((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] === type ? null : type,
    }))
  }

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopyFeedback((prev) => ({ ...prev, [activeTab]: true }))
      setTimeout(() => {
        setCopyFeedback((prev) => ({ ...prev, [activeTab]: false }))
      }, 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleRun = () => {
    setLoading((prev) => ({ ...prev, [activeTab]: true }))
    setTimeout(() => {
      setShowResults((prev) => ({ ...prev, [activeTab]: true }))
      setLoading((prev) => ({ ...prev, [activeTab]: false }))
      setLastRunTimes((prev) => ({ ...prev, [activeTab]: new Date() }))
    }, 1500)
  }

  const [lastRunTimes, setLastRunTimes] = useState<{ [key in AnalysisType]: Date | null }>({
    summary: null,
    business: null,
    themes: null,
  })

  const [isOverLimit, setIsOverLimit] = useState(false) // Declare isOverLimit variable

  const renderTabContent = () => {
    const currentFeedback = feedback[activeTab]
    const currentCopyFeedback = copyFeedback[activeTab]
    const isEditing = editingMethodology[activeTab]

    let content = ""
    let resultContent = null

    switch (activeTab) {
      case "summary":
        content = `Summary Analysis\n\n${nodes.length} nodes spanning ${new Set(nodes.map((n) => n.type)).size} types.\nPrimary themes: ${textAnalysis.themes.join(", ")}.\nKey concepts: ${textAnalysis.commonWords
          .slice(0, 3)
          .map((w) => w.word)
          .join(", ")}.`

        resultContent = showResults.summary && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-gray-700">
              {nodes.length} nodes spanning {new Set(nodes.map((n) => n.type)).size} types. Primary themes:{" "}
              {textAnalysis.themes.join(", ")}. Key concepts:{" "}
              {textAnalysis.commonWords
                .slice(0, 3)
                .map((w) => w.word)
                .join(", ")}
              .
            </p>

            <div className="flex flex-wrap gap-2">
              {textAnalysis.themes.map((theme, index) => (
                <Badge key={`theme-${index}`} className="bg-purple-100 text-purple-800 border-purple-200">
                  {theme}
                </Badge>
              ))}
              <div className="w-px h-6 bg-gray-200 mx-1" />
              {textAnalysis.commonWords.map((word, index) => (
                <Badge key={`concept-${index}`} variant="outline" className="text-gray-600 border-gray-300">
                  {word.word} ({word.count})
                </Badge>
              ))}
            </div>
          </div>
        )
        break

      case "business":
        content = `Business Impact Analysis\n\nStrategic Importance:\nThe selected components represent critical infrastructure elements that directly impact business operations, customer experience, and system reliability.\n\nOperational Impact:\nDisruption to these components could result in service degradation, data processing delays, and potential revenue impact.\n\nRisk Assessment:\nHigh interdependency between selected nodes indicates potential single points of failure. Recommend implementing redundancy and monitoring.`

        resultContent = showResults.business && (
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-semibold mb-2 text-gray-900">Strategic Importance</h5>
              <p className="text-sm text-gray-700 leading-relaxed">
                The selected components represent critical infrastructure elements that directly impact business
                operations, customer experience, and system reliability.
              </p>
            </div>

            <div>
              <h5 className="text-sm font-semibold mb-2 text-gray-900">Operational Impact</h5>
              <p className="text-sm text-gray-700 leading-relaxed">
                Disruption to these components could result in service degradation, data processing delays, and
                potential revenue impact.
              </p>
            </div>

            <div>
              <h5 className="text-sm font-semibold mb-2 text-gray-900">Risk Assessment</h5>
              <p className="text-sm text-gray-700 leading-relaxed">
                High interdependency between selected nodes indicates potential single points of failure. Recommend
                implementing redundancy and monitoring.
              </p>
            </div>
          </div>
        )
        break

      case "themes":
        content = `Key Themes Analysis\n\n${themeAnalysis.themes
          .map(
            (theme) =>
              `${theme.name} (${theme.nodes.length} nodes):\n${theme.nodes
                .slice(0, 3)
                .map((node) => `- ${node.label} (${node.type}) - ${Math.round(node.relevanceScore * 100)}%`)
                .join("\n")}\nKey Terms: ${theme.nodes
                .flatMap((n) => n.matchedKeywords)
                .slice(0, 4)
                .join(", ")}`,
          )
          .join("\n\n")}`

        resultContent = showResults.themes && themeAnalysis.themes.length > 0 && (
          <div className="space-y-6">
            {themeAnalysis.themes.map((theme, index) => (
              <div key={theme.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-gray-900">{theme.name}</h5>
                  <Badge variant="outline" className="text-xs text-gray-600">
                    {theme.nodes.length} node{theme.nodes.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="space-y-1">
                  {theme.nodes.slice(0, 3).map((node, nodeIndex) => (
                    <div key={node.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{node.label}</span>
                        <Badge variant="outline" className="text-xs text-gray-600">
                          {node.type}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">{Math.round(node.relevanceScore * 100)}%</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1">
                  {theme.nodes
                    .flatMap((n) => n.matchedKeywords)
                    .slice(0, 4)
                    .map((keyword, keyIndex) => (
                      <Badge key={keyIndex} variant="outline" className="text-xs text-gray-600">
                        {keyword}
                      </Badge>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )
        break
    }

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-purple-50">
            {isEditing ? (
              <Textarea
                value={prompts[activeTab]}
                onChange={(e) => setPrompts((prev) => ({ ...prev, [activeTab]: e.target.value }))}
                className="text-sm min-h-[100px] resize-none border-0 p-0 focus-visible:ring-0"
                placeholder="Customize the analysis prompt..."
              />
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed">{prompts[activeTab]}</p>
            )}
          </div>
        </div>

        {showResults[activeTab] && (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-gray-200 rounded-lg p-4 shadow-sm">{resultContent}</div>

            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                onClick={() => handleFeedback("up")}
                variant="ghost"
                size="sm"
                className={`h-8 px-3 ${currentFeedback === "up" ? "text-green-600 bg-green-50" : "text-gray-600"}`}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>

              <Button
                onClick={() => handleFeedback("down")}
                variant="ghost"
                size="sm"
                className={`h-8 px-3 ${currentFeedback === "down" ? "text-red-600 bg-red-50" : "text-gray-600"}`}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>

              <Button onClick={() => handleCopy(content)} variant="ghost" size="sm" className="h-8 px-3 text-gray-600">
                <Copy className="h-4 w-4" />
                {currentCopyFeedback && <span className="ml-1 text-xs">Copied!</span>}
              </Button>

              <Button onClick={handleRun} variant="ghost" size="sm" className="h-8 px-3 text-gray-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </Button>
            </div>
          </div>
        )}

        {!showResults[activeTab] && (
          <div className="text-center py-8">
            <Button
              onClick={handleRun}
              disabled={isOverLimit || loading[activeTab]}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading[activeTab] ? "Analyzing..." : "Run Analysis"}
            </Button>
          </div>
        )}
      </div>
    )
  }

  return null
}
