'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Node } from "./NewNodeComponents";

interface LassoSelectionMenuProps {
  selectedNodes: Node[];
  onClose: () => void;
  onNodeSelection?: (nodeIds: string[]) => void;
  onSendToContext?: (nodes: Node[]) => void;
  position: { x: number; y: number };
}

export function LassoSelectionMenu({
  selectedNodes,
  onClose,
  onNodeSelection,
  onSendToContext,
  position,
}: LassoSelectionMenuProps) {
  const [expanded, setExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Element)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleSendToContext = () => {
    if (onSendToContext) {
      onSendToContext(selectedNodes);
      onClose();
    }
  };

  const handleClearSelection = () => {
    if (onNodeSelection) {
      onNodeSelection([]);
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden z-50"
      style={{
        top: position.y,
        left: position.x,
        maxWidth: "400px",
        maxHeight: "80vh",
      }}
    >
      <div className="sticky top-0 bg-white border-b border-gray-200 p-3 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#1f2937]">
          {selectedNodes.length} Nodes Selected
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearSelection}
            className="text-xs px-3 py-1 hover:bg-gray-100"
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={handleSendToContext}
            className="text-xs px-3 py-1 bg-[#a855f7] hover:bg-[#9333ea] text-white"
          >
            Send to Context
          </Button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex justify-between items-center cursor-pointer p-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors rounded-md"
        >
          <span className="font-medium text-[#1f2937]">Selected Nodes</span>
          <svg
            className={`w-5 h-5 text-[#6b7280] transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {expanded && (
          <div className="mt-2 max-h-[300px] overflow-y-auto border border-gray-200 rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left py-2 px-3 font-medium text-[#6b7280]">Label</th>
                  <th className="text-left py-2 px-3 font-medium text-[#6b7280]">Type</th>
                </tr>
              </thead>
              <tbody>
                {selectedNodes.map((node) => (
                  <tr key={node.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-2 px-3 truncate max-w-[200px]">{node.label}</td>
                    <td className="py-2 px-3 text-[#6b7280]">{node.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
