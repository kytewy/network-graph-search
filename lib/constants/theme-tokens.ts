/**
 * Design tokens that map to CSS variables in globals.css
 * Use these instead of hardcoded colors to ensure theme consistency
 * 
 * @example
 * ```tsx
 * import { BRAND_COLORS, PATTERNS } from '@/lib/constants/theme-tokens';
 * 
 * // Use token classes
 * <button className="bg-primary text-primary-foreground hover:bg-primary/90">
 *   Click me
 * </button>
 * 
 * // Or use pattern presets
 * <div className={PATTERNS.dropdown}>Dropdown content</div>
 * ```
 */

// ========================================
// Primary Brand Colors (Purple Theme)
// ========================================
export const BRAND_COLORS = {
  primary: 'bg-primary text-primary-foreground',
  primaryHover: 'hover:bg-primary/90',
  primaryBorder: 'border-primary',
  primaryText: 'text-primary',
  primaryRing: 'ring-primary',
} as const;

// ========================================
// Semantic Colors
// ========================================
export const SEMANTIC_COLORS = {
  secondary: 'bg-secondary text-secondary-foreground',
  accent: 'bg-accent text-accent-foreground',
  muted: 'bg-muted text-muted-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
} as const;

// ========================================
// UI Element Colors
// ========================================
export const UI_COLORS = {
  background: 'bg-background text-foreground',
  card: 'bg-card text-card-foreground',
  popover: 'bg-popover text-popover-foreground',
  border: 'border-border',
  input: 'bg-input border-input',
  ring: 'ring-ring',
} as const;

// ========================================
// State Colors
// ========================================
export const STATE_COLORS = {
  hover: 'hover:bg-accent hover:text-accent-foreground',
  active: 'bg-primary text-primary-foreground',
  disabled: 'opacity-50 pointer-events-none',
  focus: 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
} as const;

// ========================================
// Helper Function (Optional Alternative to cn from utils)
// ========================================
/**
 * Combines multiple token classes into a single className string
 * Filters out falsy values for conditional styling
 */
export const combineTokens = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// ========================================
// Common UI Patterns
// ========================================
export const PATTERNS = {
  // Dropdown/Popover styling
  dropdown: 'bg-popover text-popover-foreground border border-border shadow-md rounded-md',
  
  // Card styling
  card: 'bg-card text-card-foreground border border-border rounded-lg shadow-sm',
  
  // Button variants
  buttonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring',
  buttonSecondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
  buttonOutline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  buttonGhost: 'hover:bg-accent hover:text-accent-foreground',
  buttonDestructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  
  // Tab states
  tabActive: 'bg-primary text-primary-foreground shadow-lg',
  tabInactive: 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
  
  // Input styling
  input: 'bg-background border-input focus-visible:ring-ring',
  
  // Badge variants
  badgePrimary: 'bg-primary text-primary-foreground hover:bg-primary/80',
  badgeSecondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  badgeOutline: 'border border-input text-foreground',
  
  // Interactive elements
  interactive: 'cursor-pointer transition-colors duration-200 hover:bg-accent/50',
  clickable: 'cursor-pointer select-none active:scale-95 transition-transform',
} as const;

// ========================================
// Spacing & Layout Tokens
// ========================================
export const SPACING = {
  panelPadding: 'p-4',
  cardPadding: 'p-6',
  sectionGap: 'space-y-4',
  itemGap: 'gap-2',
} as const;

// ========================================
// Typography Tokens
// ========================================
export const TYPOGRAPHY = {
  heading1: 'text-2xl font-bold text-foreground',
  heading2: 'text-xl font-semibold text-foreground',
  heading3: 'text-lg font-semibold text-foreground',
  body: 'text-sm text-foreground',
  bodyMuted: 'text-sm text-muted-foreground',
  caption: 'text-xs text-muted-foreground',
  label: 'text-sm font-medium text-foreground',
} as const;

// ========================================
// Animation Tokens
// ========================================
export const ANIMATIONS = {
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-200',
  slideIn: 'animate-in slide-in-from-top duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
} as const;

// ========================================
// Shadow Tokens
// ========================================
export const SHADOWS = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  inner: 'shadow-inner',
} as const;

// ========================================
// Border Radius Tokens
// ========================================
export const RADIUS = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const;

// ========================================
// Type Exports for TypeScript
// ========================================
export type BrandColor = keyof typeof BRAND_COLORS;
export type SemanticColor = keyof typeof SEMANTIC_COLORS;
export type UIColor = keyof typeof UI_COLORS;
export type StateColor = keyof typeof STATE_COLORS;
export type Pattern = keyof typeof PATTERNS;
