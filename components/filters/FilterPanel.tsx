'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Filter, Globe, FileText } from 'lucide-react';
import { useAppStore, type Node } from '@/lib/stores/app-state';

/**
 * FilterPanel - Displays filtering options for the network graph
 * Uses Zustand store directly instead of props for better data access
 */
const FilterPanel = () => {
	// Get all required state and actions from app-state store
	const filteredResults = useAppStore((state) => state.filteredResults);
	const filteredLinks = useAppStore((state) => state.filteredLinks);
	const selectedContinents = useAppStore((state) => state.selectedContinents);
	const selectedCountries = useAppStore((state) => state.selectedCountries);
	const selectedSimilarityRanges = useAppStore(
		(state) => state.selectedSimilarityRanges
	);
	const toggleContinent = useAppStore((state) => state.toggleContinent);
	const toggleCountry = useAppStore((state) => state.toggleCountry);
	const toggleSimilarityRange = useAppStore(
		(state) => state.toggleSimilarityRange
	);
	const clearLocationFilters = useAppStore(
		(state) => state.clearLocationFilters
	);

	// Get helper functions from store
	const getNodeCountByContinent = useAppStore(
		(state) => state.getNodeCountByContinent
	);
	const getNodeCountByCountry = useAppStore(
		(state) => state.getNodeCountByCountry
	);
	const getAvailableContinents = useAppStore(
		(state) => state.getAvailableContinents
	);
	const getCountriesByContinent = useAppStore(
		(state) => state.getCountriesByContinent
	);

	// For source types, we'll manage this locally since app-state might not have it
	const [selectedSourceTypes, setSelectedSourceTypes] = useState<string[]>([]);
	const toggleSourceType = (sourceType: string) => {
		setSelectedSourceTypes((prev) =>
			prev.includes(sourceType)
				? prev.filter((type) => type !== sourceType)
				: [...prev, sourceType]
		);
	};

	// For expandedContinents, we'll need to manage this locally since it's UI state
	const [expandedContinents, setExpandedContinents] = useState<string[]>([]);
	const [countrySearchTerm, setCountrySearchTerm] = useState<string>('');

	// Toggle expanded state for continents
	const toggleExpandedContinent = (continent: string) => {
		setExpandedContinents((prev) =>
			prev.includes(continent)
				? prev.filter((c) => c !== continent)
				: [...prev, continent]
		);
	};

	// Get available continents from the store
	const availableContinents = getAvailableContinents();

	// Extract source types from nodes
	const sourceTypes = [
		...new Set(filteredResults.map((node) => node.type || '').filter(Boolean)),
	];

	// For highlighted and expanded nodes tracking (simplified for now)
	const safeHighlightedNodes: string[] = [];
	const safeExpandedNodes: string[] = [];

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
							Filter by geography - {availableContinents.length} continents,{' '}
							{filteredResults.length} nodes
						</div>
					</div>
				</div>

				<div className="space-y-2">
					{availableContinents.map((continent) => {
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
										onClick={() => toggleContinent(continent)}>
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
												{getNodeCountByContinent(continent)}
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
										{(() => {
											// Get countries for this continent using the store helper
											const countriesForContinent =
												getCountriesByContinent(continent);
											// Filter countries by search term if provided
											const filteredCountries = countrySearchTerm
												? countriesForContinent.filter((country) =>
														country
															.toLowerCase()
															.includes(countrySearchTerm.toLowerCase())
												  )
												: countriesForContinent;

											return (
												<>
													<div className="text-xs text-sidebar-foreground/60 mb-1">
														{filteredCountries.length}{' '}
														{filteredCountries.length === 1
															? 'country'
															: 'countries'}
														{countrySearchTerm && ' matching search'} -{' '}
														{filteredCountries.reduce(
															(total, country) =>
																total + getNodeCountByCountry(country),
															0
														)}{' '}
														nodes
													</div>
													<div className="grid grid-cols-1 gap-1">
														{filteredCountries.map((country) => {
															const isCountrySelected =
																selectedCountries.includes(country);
															const nodeCount = getNodeCountByCountry(country);

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
																					.map((part, i) =>
																						part.toLowerCase() ===
																						countrySearchTerm.toLowerCase() ? (
																							<mark
																								key={i}
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
												</>
											);
										})()}
									</div>
								)}
							</div>
						);
					})}

					{countrySearchTerm && availableContinents.length === 0 && (
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
