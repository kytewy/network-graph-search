"use client"

import { useState } from "react"

interface Node {
  id: string
  label: string
  type: string
  size: number
  color: string
  summary: string // Brief description for tooltip
  content: string // Full article content for modal
  similarity?: number
  url?: string
  x?: number
  y?: number
  vx?: number
  vy?: number
  sourceType?: string
}

interface NodeModalProps {
  node: Node
  onClose: () => void
  onNodeSelection?: (nodeIds: string[]) => void
  selectedNodes?: string[]
}

export default function NodeModal({
  node,
  onClose,
  onNodeSelection,
  selectedNodes = [],
}: NodeModalProps) {
  const [showModalDropdown, setShowModalDropdown] = useState(false)
  const [modalDropdownAnimating, setModalDropdownAnimating] = useState(false)
  const [summaryExpanded, setSummaryExpanded] = useState(true)
  const [contentExpanded, setContentExpanded] = useState(true)

  const handleModalDropdownToggle = () => {
    if (showModalDropdown) {
      setModalDropdownAnimating(true)
      setTimeout(() => {
        setShowModalDropdown(false)
        setModalDropdownAnimating(false)
      }, 150)
    } else {
      setShowModalDropdown(true)
      setModalDropdownAnimating(true)
      setTimeout(() => {
        setModalDropdownAnimating(false)
      }, 200)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white border border-gray-200 shadow-xl rounded-lg max-w-2xl max-h-[90vh] w-full mx-4 overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-[#1f2937] mb-3">{node.label}</h2>

              <div className="flex items-center text-sm text-[#6b7280]">
                <span>{node.type}</span>
                <span className="mx-2">•</span>
                <span>{node.sourceType}</span>
                {node.similarity && (
                  <>
                    <span className="mx-2">•</span>
                    <span>Similarity: {node.similarity.toFixed(1)}%</span>
                  </>
                )}
                <span className="mx-2">•</span>
                <span>Size: {node.size}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <button
                  className="text-xs px-3 py-1 rounded-md bg-[#a855f7] hover:bg-[#9333ea] text-white transition-all duration-200 flex items-center gap-1"
                  onClick={handleModalDropdownToggle}
                >
                  <span>Actions</span>
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${showModalDropdown ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showModalDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md py-1 min-w-[160px] z-10 overflow-hidden shadow-lg">
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        if (onNodeSelection && node) {
                          const currentSelected = selectedNodes || []
                          const isAlreadySelected = currentSelected.includes(node.id)
                          if (isAlreadySelected) {
                            onNodeSelection(currentSelected.filter((id) => id !== node.id))
                          } else {
                            onNodeSelection([...currentSelected, node.id])
                          }
                        }
                        setShowModalDropdown(false)
                        setModalDropdownAnimating(false)
                      }}
                    >
                      {selectedNodes?.includes(node.id) ? "Remove from Selection ✓" : "Add to Selection"}
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        window.open(node.url || "https://www.google.com", "_blank")
                        setShowModalDropdown(false)
                        setModalDropdownAnimating(false)
                      }}
                    >
                      Open Link
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="border-b border-gray-200">
              <button
                onClick={() => setSummaryExpanded(!summaryExpanded)}
                className="w-full flex justify-between items-center cursor-pointer p-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-[#1f2937]">Summary</span>
                <svg
                  className={`w-5 h-5 text-[#6b7280] transition-transform duration-200 ${summaryExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {summaryExpanded && (
                <div className="p-4 text-sm text-[#374151] leading-relaxed">{node.summary}</div>
              )}
            </div>

            <div>
              <button
                onClick={() => setContentExpanded(!contentExpanded)}
                className="w-full flex justify-between items-center cursor-pointer p-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-[#1f2937]">Full Content</span>
                <svg
                  className={`w-5 h-5 text-[#6b7280] transition-transform duration-200 ${contentExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {contentExpanded && (
                <div className="p-4 text-sm text-[#374151] leading-relaxed max-h-[400px] overflow-y-auto">
                  {node.content}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
