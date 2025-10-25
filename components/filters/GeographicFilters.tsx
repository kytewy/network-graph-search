'use client';

import { Badge } from '@/components/ui/badge';
import { safeIncludes } from '@/lib/utils/array-safety';

interface GeographicFiltersProps {
	availableContinents: string[];
	selectedContinents: string[];
	selectedCountries: string[];
	expandedContinents: string[];
	countrySearchTerm: string;
	filteredResultsCount: number;
	toggleContinent: (continent: string) => void;
	toggleCountry: (country: string) => void;
	toggleExpandedContinent: (continent: string) => void;
	getNodeCountByContinent: (continent: string) => number;
	getNodeCountByCountry: (country: string) => number;
	getCountriesByContinent: (continent: string) => string[];
}

export function GeographicFilters({
	availableContinents,
	selectedContinents,
	selectedCountries,
	expandedContinents,
	countrySearchTerm,
	filteredResultsCount,
	toggleContinent,
	toggleCountry,
	toggleExpandedContinent,
	getNodeCountByContinent,
	getNodeCountByCountry,
	getCountriesByContinent,
}: GeographicFiltersProps) {
	return (
		<div className="space-y-2">
				{availableContinents.map((continent) => {
					const isSelected = safeIncludes(selectedContinents, continent);
					const isExpanded = safeIncludes(expandedContinents, continent);

					return (
						<div key={continent} className="space-y-1">
							<div className="flex items-center gap-2">
								<Badge
									variant={isSelected ? 'default' : 'outline'}
									className={`cursor-pointer transition-colors flex-1 justify-between ${
										isSelected
											? 'bg-primary text-primary-foreground hover:bg-primary/90'
											: 'hover:bg-accent/50'
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
														const isCountrySelected = safeIncludes(selectedCountries, country);
														const nodeCount = getNodeCountByCountry(country);

														return (
															<div
																key={country}
																className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
																	isCountrySelected
																		? 'bg-primary text-primary-foreground hover:bg-primary/90'
																		: 'hover:bg-accent/50'
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
	);
}
