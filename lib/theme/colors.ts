// Centralized color theme for network graph visualization

// Base color palette
export const nodeColors = {
  // Base colors
  primary: '#3b82f6',    // Blue
  secondary: '#059669',  // Green
  tertiary: '#f59e0b',   // Orange/Yellow
  quaternary: '#dc2626', // Red
  accent: '#7c3aed',     // Purple
  neutral: '#6b7280',    // Gray
  
  // Semantic colors
  low: '#dc2626',        // Red
  medium: '#f59e0b',     // Orange/Yellow
  high: '#059669',       // Green
};

// Color mappings for different attributes
export const colorMappings = {
  sourceType: {
    Government: nodeColors.primary,
    'Tech Company': nodeColors.secondary,
    'News Article': nodeColors.tertiary,
    'Law Firm': nodeColors.quaternary,
    NGO: nodeColors.accent,
    default: nodeColors.neutral
  },
  country: {
    USA: nodeColors.quaternary,
    Germany: '#000000', // Black
    Canada: nodeColors.quaternary,
    Japan: nodeColors.quaternary,
    France: nodeColors.primary,
    Luxembourg: nodeColors.primary,
    Mexico: nodeColors.secondary,
    'South Korea': nodeColors.tertiary,
    Australia: nodeColors.accent,
    default: nodeColors.neutral
  },
  continent: {
    'North America': nodeColors.quaternary,
    Europe: nodeColors.primary,
    Asia: nodeColors.tertiary,
    Oceania: nodeColors.accent,
    default: nodeColors.neutral
  },
  documentType: {
    recital: '#15803d', // Specific green
    article: nodeColors.accent,
    default: nodeColors.neutral
  }
};

/**
 * Get color by mode and attribute
 * @param mode The color mode (sourceType, continent, etc.)
 * @param attribute The specific attribute value
 * @returns The color for the given attribute or default color
 */
export function getColorByMode(mode: string, attribute: string): string {
  const mapping = colorMappings[mode as keyof typeof colorMappings];
  if (!mapping) return nodeColors.neutral;
  
  return mapping[attribute as keyof typeof mapping] || mapping.default;
}

/**
 * Get color based on similarity value
 * @param similarity Similarity value (0-100)
 * @returns Color representing the similarity level
 */
export function getSimilarityColor(similarity?: number): string {
  if (similarity === undefined || similarity === null) return nodeColors.neutral;
  if (similarity <= 33) return nodeColors.low;
  if (similarity <= 66) return nodeColors.medium;
  return nodeColors.high;
}

/**
 * Get node color based on node data and color mode
 * @param node The node object
 * @param mode The color mode
 * @returns The appropriate color for the node
 */
export function getNodeColorByMode(node: any, mode: string): string {
  if (mode === 'similarityRange') {
    return getSimilarityColor(node.similarity);
  }
  
  // Map the attribute based on mode
  const attributeMap: Record<string, string> = {
    sourceType: 'sourceType',
    continent: 'continent',
    country: 'country',
    documentType: 'type'
  };
  
  const attributeName = attributeMap[mode];
  if (!attributeName) return node.color;
  
  const attributeValue = node[attributeName];
  return getColorByMode(mode, attributeValue);
}
