'use client';

import { useAppStore } from '@/lib/stores/app-state';
import { useLayoutStore } from '@/lib/stores/layout-store';
import { nodeColors, colorMappings, getColorByMode, getSimilarityColor } from '@/lib/theme/colors';

interface Node {
  id: string;
  label: string;
  summary: string;
  content: string;
  type: string;
  continent: string;
  country: string;
  sourceType: string;
  size: number;
  color: string;
  similarity?: number;
  stateProvince?: string;
}

interface ColorLegendProps {
  filteredNodes: Node[];
}

export function ColorLegend({ filteredNodes }: ColorLegendProps) {
  const colorMode = useAppStore((state) => state.colorMode);
  const nodeSizeMode = useAppStore((state) => state.nodeSizeMode);

  const getColorLegendData = () => {
    switch (colorMode) {
      case 'sourceType':
        // Use the centralized sourceType color mapping
        return Object.entries(colorMappings.sourceType)
          .filter(([key]) => key !== 'default')
          .map(([label, color]) => ({ label, color }));

      case 'country':
        // Get visible countries and map them to colors using the centralized system
        const visibleCountries = [
          ...new Set(filteredNodes.map((node) => node.country)),
        ];
        return visibleCountries
          .filter(Boolean)
          .map((country) => ({
            label: country,
            color: getColorByMode('country', country),
          }));

      case 'continent':
        // Get visible continents and map them to colors using the centralized system
        const visibleContinents = [
          ...new Set(filteredNodes.map((node) => node.continent)),
        ];
        return visibleContinents
          .filter(Boolean)
          .map((continent) => ({
            label: continent,
            color: getColorByMode('continent', continent),
          }));

      case 'documentType':
        // Get visible document types and map them to colors using the centralized system
        const visibleTypes = [...new Set(filteredNodes.map((node) => node.type))];
        return visibleTypes
          .filter(Boolean)
          .map((type) => ({
            label: type,
            color: getColorByMode('documentType', type),
          }));

      case 'similarityRange':
        // Use the centralized similarity color ranges
        return [
          { label: 'High (67-100%)', color: nodeColors.high },
          { label: 'Medium (34-66%)', color: nodeColors.medium },
          { label: 'Low (0-33%)', color: nodeColors.low },
        ];

      default:
        return [];
    }
  };

  return (
    <div className="absolute top-4 left-4 space-y-4 pointer-events-none">
      {/* Color Legend */}
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Color by:{' '}
          {colorMode === 'sourceType'
            ? 'Source Type'
            : colorMode === 'continent'
            ? 'Continent'
            : colorMode === 'similarityRange'
            ? 'Similarity Range'
            : colorMode === 'documentType'
            ? 'Document Type'
            : 'Country'}
        </div>
        <div className="space-y-1">
          {getColorLegendData().map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Size Legend */}
      {nodeSizeMode !== 'none' && (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Size by:{' '}
            {nodeSizeMode === 'contentLength'
              ? 'Content Length'
              : nodeSizeMode === 'summaryLength'
              ? 'Summary Length'
              : 'Similarity'}
          </div>
          <div className="space-y-1">
            {nodeSizeMode === 'contentLength' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: nodeColors.neutral }} />
                  <span className="text-xs text-gray-600">
                    Small (0-30 chars)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.neutral }} />
                  <span className="text-xs text-gray-600">
                    Medium (30-60 chars)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: nodeColors.neutral }} />
                  <span className="text-xs text-gray-600">
                    Large (60+ chars)
                  </span>
                </div>
              </>
            )}
            {nodeSizeMode === 'summaryLength' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: nodeColors.neutral }} />
                  <span className="text-xs text-gray-600">
                    Small (0-15 chars)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.neutral }} />
                  <span className="text-xs text-gray-600">
                    Medium (15-25 chars)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: nodeColors.neutral }} />
                  <span className="text-xs text-gray-600">
                    Large (25+ chars)
                  </span>
                </div>
              </>
            )}
            {nodeSizeMode === 'similarity' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: nodeColors.neutral }} />
                  <span className="text-xs text-gray-600">Low (0-33%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors.neutral }} />
                  <span className="text-xs text-gray-600">
                    Medium (34-66%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: nodeColors.neutral }} />
                  <span className="text-xs text-gray-600">
                    High (67-100%)
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
