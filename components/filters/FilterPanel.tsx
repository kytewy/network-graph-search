'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Filter, Globe, FileText } from 'lucide-react';
import { useAppStore, type Node } from '@/lib/stores/app-state';
import { CONTINENT_COUNTRY_MAP } from '@/lib/stores/country_map';

interface FilterPanelProps {
	filteredNodes: any[];
	filteredLinks: any[];
	safeNodes: any[];
	sourceTypes: string[];
	safeHighlightedNodes: string[];
	safeExpandedNodes: string[];
	toggleExpandedContinent: (continent: string) => void;
	handleSimilarityRangeClick: (range: string) => void;
	continentCountries: Record<string, string[]>;
	filteredContinentCountries: Record<string, string[]>;
}

const FilterPanel = ({
	filteredNodes,
	filteredLinks,
	safeNodes,
	sourceTypes,
	safeHighlightedNodes,
	safeExpandedNodes,
	toggleExpandedContinent,
	handleSimilarityRangeClick,
	continentCountries,
	filteredContinentCountries,
}: FilterPanelProps) => {
	// Get all required state and actions from app-state store
	const selectedContinents = useAppStore((state) => state.selectedContinents);
	const selectedCountries = useAppStore((state) => state.selectedCountries);
	const toggleContinent = useAppStore((state) => state.toggleContinent);
	const toggleCountry = useAppStore((state) => state.toggleCountry);
	const clearLocationFilters = useAppStore((state) => state.clearLocationFilters);
	
	// For source types, we'll manage this locally since app-state might not have it
	const [selectedSourceTypes, setSelectedSourceTypes] = useState<string[]>([]);
	const toggleSourceType = (sourceType: string) => {
		setSelectedSourceTypes(prev => 
			prev.includes(sourceType) 
				? prev.filter(type => type !== sourceType)
				: [...prev, sourceType]
		);
	};
	
	// For expandedContinents, we'll need to manage this locally since it's UI state
	const [expandedContinents, setExpandedContinents] = useState<string[]>([]);
	const [countrySearchTerm, setCountrySearchTerm] = useState<string>('');

	// Get data from app-state store
	const appFilteredResults = useAppStore((state) => state.filteredResults);
	const appFilteredLinks = useAppStore((state) => state.filteredLinks);

	// Debug output to check node structure
	console.log(
		'FilterPanel appFilteredResults:',
		appFilteredResults.length,
		appFilteredResults[0]
	);
	console.log('FilterPanel continents:', continentCountries);

	return (
		<div className="rounded-lg p-4 space-y-4 bg-white">
			<Label className="text-sidebar-foreground font-medium text-base">
				Data Filters
			</Label>

			{/* Geographic Filters */}
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<Globe className="h-4 w-4 text-sidebar-foreground" />
					<Label className="text-sidebar-foreground font-medium text-sm">
						Geographic Filters
					</Label>
				</div>

				<div className="space-y-2">
					<div className="relative">
						<div className="text-xs text-sidebar-foreground/70 mb-2">
							Filter by geography - {Object.keys(continentCountries).length}{' '}
							continents, {safeNodes.length} nodes
						</div>
					</div>
				</div>

				<div className="space-y-2">
					{Object.entries(filteredContinentCountries).map(
						([continent, countries]) => {
							const isSelected = selectedContinents.includes(continent);
							const isExpanded = expandedContinents.includes(continent);

							return (
								<div key={continent} className="space-y-1">
									<div className="flex items-center gap-2">
										<Badge
											variant={isSelected ? 'default' : 'outline'}
											className={`cursor-pointer transition-colors flex-1 justify-between ${
												isSelected
													? 'bg-[#a855f7] text-white hover:bg-[#9333ea]'
													: 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
											}`}
											onClick={() =>
												toggleContinent && toggleContinent(continent)
											}>
											<span>
												{continent} {isSelected && '✓'}
											</span>
											<div className="flex items-center gap-2">
												{/* Count badge with explicit styling */}
												<div
													className={`text-xs px-2 py-0.5 rounded-full ${
														isSelected
															? 'bg-white/20 text-white'
															: 'bg-gray-200 text-gray-700'
													}`}
													style={{
														minWidth: '24px',
														textAlign: 'center',
														display: 'inline-block',
													}}>
													{(() => {
														// Calculate count with explicit check for continent property
														const count = appFilteredResults.filter(
															(node: Node) =>
																node && node.fields?.continent === continent
														).length;
														return count;
													})()}
												</div>
												<button
													onClick={(e) => {
														e.stopPropagation();
														toggleExpandedContinent(continent);
													}}
													className="hover:opacity-70 transition-opacity">
													<span
														className={`inline-block transition-transform duration-200 text-sm ${
															isExpanded ? 'rotate-180' : ''
														}`}>
														▼
													</span>
												</button>
											</div>
										</Badge>
									</div>

									{isExpanded && (
										<div className="ml-4 space-y-1 max-h-48 overflow-y-auto">
											<div className="text-xs text-sidebar-foreground/60 mb-1">
												{countries.length}{' '}
												{countries.length === 1 ? 'country' : 'countries'}
												{countrySearchTerm && ' matching search'}-{' '}
												{
													appFilteredResults.filter((node: Node) =>
														countries.includes(node.fields?.country)
													).length
												}{' '}
												nodes
											</div>
											<div className="grid grid-cols-1 gap-1">
												{countries.map((country) => {
													const isCountrySelected =
														selectedCountries.includes(country);
													const nodeCount = appFilteredResults.filter(
														(node: Node) => node.fields?.country === country
													).length;

													return (
														<div
															key={country}
															className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
																isCountrySelected
																	? 'bg-[#a855f7] text-white'
																	: 'bg-gray-50 hover:bg-gray-100 text-gray-700'
															}`}
															onClick={() => toggleCountry(country)}>
															<span className="text-xs font-medium">
																{countrySearchTerm
																	? country
																			.split(
																				new RegExp(
																					`(${countrySearchTerm})`,
																					'gi'
																				)
																			)
																			.map((part, index) =>
																				part.toLowerCase() ===
																				countrySearchTerm.toLowerCase() ? (
																					<mark
																						key={index}
																						className="bg-yellow-200 text-gray-900 px-0.5 rounded">
																						{part}
																					</mark>
																				) : (
																					part
																				)
																			)
																	: country}
															</span>
															<div className="flex items-center gap-1">
																<span
																	className={`text-xs px-1.5 py-0.5 rounded-full ${
																		isCountrySelected
																			? 'bg-white/20 text-white'
																			: 'bg-gray-200 text-gray-700'
																	}`}>
																	{nodeCount}
																</span>
																{isCountrySelected && (
																	<span className="text-xs">✓</span>
																)}
															</div>
														</div>
													);
												})}
											</div>
										</div>
									)}
								</div>
							);
						}
					)}

					{countrySearchTerm &&
						Object.keys(filteredContinentCountries).length === 0 && (
							<div className="text-center py-4 text-sm text-sidebar-foreground/60">
								No countries found matching "{countrySearchTerm}"
							</div>
						)}
				</div>
			</div>

			{/* Source Type Filters */}
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<FileText className="h-4 w-4 text-sidebar-foreground" />
					<Label className="text-sidebar-foreground font-medium text-sm">
						Source Type Filters
					</Label>
				</div>
				<div className="flex flex-wrap gap-2">
					{/* Updated source type badges to use gray for inactive states */}
					{sourceTypes.map((sourceType) => (
						<Badge
							key={sourceType}
							variant={
								selectedSourceTypes.includes(sourceType) ? 'default' : 'outline'
							}
							className={`cursor-pointer transition-colors ${
								selectedSourceTypes.includes(sourceType)
									? 'bg-[#a855f7] text-white hover:bg-[#9333ea]'
									: 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
							}`}
							onClick={() => toggleSourceType(sourceType)}>
							{sourceType}
						</Badge>
					))}
				</div>
			</div>

			<Card className="p-4 bg-card border-sidebar-border">
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-card-foreground/70">Visible Nodes:</span>
						<span className="font-medium text-card-foreground">
							{appFilteredResults.length}
						</span>
					</div>
					<div className="flex justify-between text-sm">
						<span className="text-card-foreground/70">Visible Links:</span>
						<span className="font-medium text-card-foreground">
							{appFilteredLinks.length}
						</span>
					</div>
					<div className="flex justify-between text-sm">
						<span className="text-card-foreground/70">Highlighted:</span>
						<span className="font-medium text-card-foreground">
							{safeHighlightedNodes.length}
						</span>
					</div>
					{safeExpandedNodes.length > 0 && (
						<div className="flex justify-between text-sm">
							<span className="text-card-foreground/70">Expanded:</span>
							<span className="font-medium text-card-foreground">
								{safeExpandedNodes.length}
							</span>
						</div>
					)}
				</div>
			</Card>

			<Button
				onClick={() => {
					clearLocationFilters();
					setSelectedSourceTypes([]);
				}}
				variant="outline"
				className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground bg-transparent">
				<Filter className="h-4 w-4 mr-2" />
				Clear All Filters
			</Button>
		</div>
	);
};

export default FilterPanel;
