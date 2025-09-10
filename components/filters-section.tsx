"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useFilterStore } from "@/lib/stores/filter-store"
import { useNetworkStore } from "@/lib/stores/network-store"
import { SimilarityHistogram } from "@/components/similarity-histogram"

export function FiltersSection() {
  const nodes = useNetworkStore((state) => state.nodes)

  const selectedNodeTypes = useFilterStore((state) => state.selectedNodeTypes)
  const selectedContinents = useFilterStore((state) => state.selectedContinents)
  const selectedCountries = useFilterStore((state) => state.selectedCountries)
  const selectedSourceTypes = useFilterStore((state) => state.selectedSourceTypes)
  const expandedContinents = useFilterStore((state) => state.expandedContinents)

  const toggleNodeType = useFilterStore((state) => state.toggleNodeType)
  const toggleContinent = useFilterStore((state) => state.toggleContinent)
  const toggleCountry = useFilterStore((state) => state.toggleCountry)
  const toggleSourceType = useFilterStore((state) => state.toggleSourceType)
  const setExpandedContinents = useFilterStore((state) => state.setExpandedContinents)
  const clearFilters = useFilterStore((state) => state.clearFilters)

  const nodeTypes = [...new Set(nodes.map((node) => node.type))].filter(Boolean)
  const continents = [...new Set(nodes.map((node) => node.continent))].filter(Boolean)
  const sourceTypes = [...new Set(nodes.map((node) => node.sourceType))].filter(Boolean)

  const continentCountries = nodes.reduce(
    (acc, node) => {
      if (node.continent && node.country) {
        if (!acc[node.continent]) acc[node.continent] = new Set()
        acc[node.continent].add(node.country)
      }
      return acc
    },
    {} as Record<string, Set<string>>,
  )

  const toggleContinentExpansion = (continent: string) => {
    const newExpanded = expandedContinents.includes(continent)
      ? expandedContinents.filter((c) => c !== continent)
      : [...expandedContinents, continent]
    setExpandedContinents(newExpanded)
  }

  return (
    <div className="rounded-lg p-4 space-y-4 bg-white">
      <Label className="text-sidebar-foreground font-medium text-base">Data Filters</Label>

      {/* Node Type Filters */}
      <div className="space-y-2">
        <Label className="text-sm text-sidebar-foreground/70">Node Types</Label>
        <div className="flex flex-wrap gap-2">
          {nodeTypes.map((type) => (
            <Badge
              key={type}
              variant={selectedNodeTypes.includes(type) ? "default" : "outline"}
              className={`cursor-pointer transition-colors ${
                selectedNodeTypes.includes(type) ? "bg-purple-600 hover:bg-purple-700 text-white" : "hover:bg-gray-100"
              }`}
              onClick={() => toggleNodeType(type)}
            >
              {type}
            </Badge>
          ))}
        </div>
      </div>

      {/* Geographic Filters */}
      <div className="space-y-2">
        <Label className="text-sm text-sidebar-foreground/70">Geographic Filters</Label>
        <div className="space-y-1">
          {continents.map((continent) => {
            const isSelected = selectedContinents.includes(continent)
            const isExpanded = expandedContinents.includes(continent)
            const countries = Array.from(continentCountries[continent] || [])

            return (
              <div key={continent} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-colors flex-1 justify-start ${
                      isSelected ? "bg-purple-600 hover:bg-purple-700 text-white" : "hover:bg-gray-100"
                    }`}
                    onClick={() => toggleContinent(continent)}
                  >
                    {continent}
                  </Badge>
                  {countries.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleContinentExpansion(continent)}
                    >
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </Button>
                  )}
                </div>

                {isExpanded && countries.length > 0 && (
                  <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {countries.map((country) => (
                      <Badge
                        key={country}
                        variant={selectedCountries.includes(country) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors text-xs ${
                          selectedCountries.includes(country)
                            ? "bg-purple-500 hover:bg-purple-600 text-white"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => toggleCountry(country)}
                      >
                        {country}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Source Type Filters */}
      <div className="space-y-2">
        <Label className="text-sm text-sidebar-foreground/70">Source Types</Label>
        <div className="flex flex-wrap gap-2">
          {sourceTypes.map((type) => (
            <Badge
              key={type}
              variant={selectedSourceTypes.includes(type) ? "default" : "outline"}
              className={`cursor-pointer transition-colors ${
                selectedSourceTypes.includes(type)
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => toggleSourceType(type)}
            >
              {type}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-sidebar-foreground/70">Similarity Distribution</Label>
        <SimilarityHistogram />
      </div>

      <Button
        onClick={clearFilters}
        variant="outline"
        className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground bg-transparent"
      >
        Clear All Filters
      </Button>
    </div>
  )
}
