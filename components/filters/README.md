# Filters Components

Filtering UI components for the network graph visualization.

## Components

### **FilterPanel.tsx** (Main Coordinator)
The main component that manages filter state and coordinates sub-components.

**Responsibilities:**
- Manages local UI state (expandedContinents, selectedSourceTypes, countrySearchTerm)
- Accesses Zustand store for filter data and actions
- Delegates rendering to focused sub-components
- Provides clear filters functionality

**Size:** 111 lines (down from 300)

**Usage:**
```tsx
import FilterPanel from '@/components/filters/FilterPanel';

<FilterPanel />
```

---

### **GeographicFilters.tsx**
Handles continent and country filtering UI with expandable sections.

**Features:**
- Continent selection with node counts
- Expandable country lists
- Country search term highlighting
- Visual feedback for selected items

**Size:** 208 lines

**Props:**
- `availableContinents`: List of continents to display
- `selectedContinents`: Currently selected continents
- `selectedCountries`: Currently selected countries
- `expandedContinents`: Continents with expanded country lists
- `countrySearchTerm`: Search term for filtering countries
- `filteredResultsCount`: Total number of filtered nodes
- `toggleContinent`: Handler for continent selection
- `toggleCountry`: Handler for country selection
- `toggleExpandedContinent`: Handler for expanding/collapsing continents
- `getNodeCountByContinent`: Function to get node count per continent
- `getNodeCountByCountry`: Function to get node count per country
- `getCountriesByContinent`: Function to get countries for a continent

---

### **SourceTypeFilters.tsx**
Displays source type badge filters.

**Features:**
- Badge-style filter UI
- Visual feedback for selected types
- Simple toggle interaction

**Size:** 42 lines

**Props:**
- `sourceTypes`: List of available source types
- `selectedSourceTypes`: Currently selected source types
- `toggleSourceType`: Handler for source type selection

---

## Architecture

**Before Refactoring:**
- 1 monolithic file (300 lines)
- Mixed business logic and UI rendering
- 71% JSX (214 lines)

**After Refactoring:**
- 3 focused components
- Clear separation: coordinator vs presentational
- 63% reduction in main component (300→111 lines)
- No new hooks created (avoiding hook proliferation)

**Pattern Used:** Component Decomposition (not hook extraction)

---

## State Management

**Store State (Zustand):**
- `filteredResults` - All nodes after filtering
- `selectedContinents` - Selected continent filters
- `selectedCountries` - Selected country filters
- Filter action functions (toggle, clear, etc.)

**Local UI State:**
- `expandedContinents` - Which continents show country lists
- `selectedSourceTypes` - Local source type selections
- `countrySearchTerm` - Search input for filtering countries

---

## Benefits

✅ **Easier to Read** - Each file has one clear purpose  
✅ **Easier to Test** - Components can be tested independently  
✅ **Easier to Maintain** - Changes isolated to specific files  
✅ **No Hook Proliferation** - Logic stays in coordinator  
✅ **Better Organization** - Natural React composition patterns

---

## File Structure

```
components/filters/
├── FilterPanel.tsx          (111 lines) - Main coordinator
├── GeographicFilters.tsx    (208 lines) - Geographic filtering UI
├── SourceTypeFilters.tsx    ( 42 lines) - Source type filtering UI
└── README.md                           - This file
```
