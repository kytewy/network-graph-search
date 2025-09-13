'use client';

import { useLayoutStore } from '@/lib/stores/layout-store';

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
  const colorMode = useLayoutStore((state) => state.colorMode);
  const nodeSizeMode = useLayoutStore((state) => state.nodeSizeMode);

  const getColorLegendData = () => {
    switch (colorMode) {
      case 'sourceType':
        return [
          { label: 'Government', color: '#3b82f6' },
          { label: 'Tech Company', color: '#059669' },
          { label: 'News Article', color: '#f59e0b' },
          { label: 'Law Firm', color: '#dc2626' },
          { label: 'NGO', color: '#7c3aed' },
        ];
      case 'country':
        const visibleCountries = [
          ...new Set(filteredNodes.map((node) => node.country)),
        ];
        const countryColors = {
          USA: '#dc2626', // Red
          Germany: '#000000', // Black
          Canada: '#dc2626', // Red
          France: '#3b82f6', // Blue
          'United Kingdom': '#059669', // Green
          Japan: '#f59e0b', // Yellow
          China: '#7c3aed', // Purple
          Australia: '#059669', // Green
          Brazil: '#f59e0b', // Yellow
          India: '#3b82f6', // Blue
        };
        return visibleCountries
          .filter(Boolean)
          .map((country) => ({
            label: country,
            color: countryColors[country as keyof typeof countryColors] || '#6b7280',
          }));
      case 'continent':
        const visibleContinents = [
          ...new Set(filteredNodes.map((node) => node.continent)),
        ];
        const continentColors = {
          'North America': '#dc2626', // Red
          Europe: '#3b82f6', // Blue
          Asia: '#059669', // Green
          'South America': '#f59e0b', // Yellow
          Africa: '#7c3aed', // Purple
          Oceania: '#0891b2', // Cyan
          Antarctica: '#6b7280', // Gray
        };
        return visibleContinents
          .filter(Boolean)
          .map((continent) => ({
            label: continent,
            color:
              continentColors[continent as keyof typeof continentColors] || '#6b7280',
          }));
      case 'documentType':
        const visibleTypes = [...new Set(filteredNodes.map((node) => node.type))];
        const typeColors = {
          Article: '#3b82f6', // Blue
          Regulation: '#dc2626', // Red
          Standard: '#059669', // Green
          Framework: '#f59e0b', // Yellow
          Guideline: '#7c3aed', // Purple
          Policy: '#0891b2', // Cyan
          Report: '#6b7280', // Gray
        };
        return visibleTypes
          .filter(Boolean)
          .map((type) => ({
            label: type,
            color: typeColors[type as keyof typeof typeColors] || '#6b7280',
          }));
      case 'similarityRange':
        return [
          { label: 'High (80-100%)', color: '#059669' }, // Green
          { label: 'Medium (40-79%)', color: '#f59e0b' }, // Yellow
          { label: 'Low (0-39%)', color: '#dc2626' }, // Red
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
                  <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600">
                    Small (0-30 chars)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600">
                    Medium (30-60 chars)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600">
                    Large (60+ chars)
                  </span>
                </div>
              </>
            )}
            {nodeSizeMode === 'summaryLength' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600">
                    Small (0-15 chars)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600">
                    Medium (15-25 chars)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600">
                    Large (25+ chars)
                  </span>
                </div>
              </>
            )}
            {nodeSizeMode === 'similarity' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600">Low (0-30%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600">
                    Medium (30-70%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600">
                    High (70-100%)
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
