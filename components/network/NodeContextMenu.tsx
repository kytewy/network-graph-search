"use client"

import NodeTooltip from "./NodeTooltip"
import NodeModal from "./NodeModal"

export { NodeTooltip, NodeModal }

// Types shared between components
export interface Node {
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
