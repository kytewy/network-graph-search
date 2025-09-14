"use client"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"

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

interface NodeTooltipProps {
  node: Node
  mousePos: { x: number; y: number }
  onNodeSelection?: (nodeIds: string[]) => void
  selectedNodes?: string[]
  onClose: () => void
  onReadMore: (node: Node) => void
}

export default function NodeTooltip({
  node,
  mousePos,
  onNodeSelection,
  selectedNodes = [],
  onClose,
  onReadMore,
}: NodeTooltipProps) {
  const hideTooltipTimeoutRef = useRef<number | null>(null)
  const [showTooltipDropdown, setShowTooltipDropdown] = useState(false)
  const [tooltipDropdownAnimating, setTooltipDropdownAnimating] = useState(false)

  const handleTooltipDropdownToggle = () => {
    if (showTooltipDropdown) {
      setTooltipDropdownAnimating(true)
      setTimeout(() => {
        setShowTooltipDropdown(false)
        setTooltipDropdownAnimating(false)
      }, 150)
    } else {
      setShowTooltipDropdown(true)
      setTooltipDropdownAnimating(true)
      setTimeout(() => {
        setTooltipDropdownAnimating(false)
      }, 200)
    }
  }

  const getSmartTooltipPosition = (mouseX: number, mouseY: number) => {
    const tooltipWidth = 360
    const tooltipHeight = 250
    const offset = 8
    const margin = 10

    let left = mouseX + offset
    let top = mouseY - offset

    if (left + tooltipWidth + margin > window.innerWidth) {
      left = mouseX - tooltipWidth - offset
    }

    if (left < margin) {
      left = margin
    }

    if (top + tooltipHeight + margin > window.innerHeight) {
      top = mouseY - tooltipHeight - offset
    }

    if (top < margin) {
      top = mouseY + offset + 20
    }

    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin))
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin))

    return { left, top }
  }

  return (
    <Card
      data-tooltip="true"
      className="fixed z-50 p-4 bg-white border border-gray-200 shadow-xl transition-all duration-200 ease-out rounded-lg"
      style={{
        left: `${getSmartTooltipPosition(mousePos.x, mousePos.y).left}px`,
        top: `${getSmartTooltipPosition(mousePos.x, mousePos.y).top}px`,
        width: "360px",
        pointerEvents: "auto",
      }}
      onMouseEnter={() => {
        if (hideTooltipTimeoutRef.current) {
          clearTimeout(hideTooltipTimeoutRef.current)
          hideTooltipTimeoutRef.current = null
        }
      }}
      onMouseLeave={onClose}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="font-semibold text-[#1f2937] text-base leading-tight">{node.label}</div>
          <div className="relative flex-shrink-0">
            <button
              className="text-xs px-3 py-1 rounded-md bg-[#a855f7] hover:bg-[#9333ea] text-white transition-all duration-200 flex items-center gap-1"
              onClick={handleTooltipDropdownToggle}
            >
              <span>Actions</span>
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${showTooltipDropdown ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showTooltipDropdown && (
              <div
                className={`absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md py-1 min-w-[160px] z-10 overflow-hidden transition-all duration-200 ease-out transform-gpu origin-top-right shadow-lg`}
              >
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
                    setShowTooltipDropdown(false)
                    setTooltipDropdownAnimating(false)
                  }}
                >
                  {selectedNodes?.includes(node.id) ? "Remove from Selection ✓" : "Add to Selection"}
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    onReadMore(node)
                    setShowTooltipDropdown(false)
                    setTooltipDropdownAnimating(false)
                  }}
                >
                  Read More
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    window.open(node.url || "https://www.google.com", "_blank")
                    setShowTooltipDropdown(false)
                    setTooltipDropdownAnimating(false)
                  }}
                >
                  Open Link
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded-md">
          <div className="flex items-center pr-3 border-r border-gray-200">
            <span className="text-[#6b7280]">Type:</span>{" "}
            <span className="font-medium text-[#374151] ml-1">{node.type}</span>
          </div>
          <div className="flex items-center pr-3 border-r border-gray-200">
            <span className="text-[#6b7280]">Size:</span>{" "}
            <span className="font-medium text-[#374151] ml-1">{node.size}</span>
          </div>
          {node.similarity && (
            <div className="flex items-center">
              <span className="text-[#6b7280]">Similarity:</span>{" "}
              <span className="font-medium text-[#374151] ml-1">{node.similarity.toFixed(1)}%</span>
            </div>
          )}
        </div>

        {node.summary && (
          <div>
            <div className="text-xs font-medium text-[#6b7280] mb-2">Summary:</div>
            <div className="text-sm text-[#374151] h-28 min-h-20 overflow-y-auto leading-relaxed bg-white p-3 rounded border border-gray-200">
              {node.summary}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
