const CONTINENT_COUNTRY_MAP = {
	Europe: [
		'France',
		'Germany',
		'Luxembourg',
		'Spain',
		'Italy',
		'Netherlands',
		'Belgium',
		'Austria',
		'European Union', // Added European Union as a country within Europe
	],
	'North America': ['USA', 'Canada', 'Mexico'],
	Asia: ['Japan', 'China', 'South Korea', 'Singapore', 'India'],
	Oceania: ['Australia', 'New Zealand'],
};

// Reverse mapping: country -> continentwith
// Automatically generated from the continent map above
const COUNTRY_CONTINENT_MAP = Object.entries(CONTINENT_COUNTRY_MAP).reduce(
	(acc, [continent, countries]) => {
		countries.forEach((country) => {
			acc[country] = continent;
		});
		return acc;
	},
	{} as Record<string, string>
);

export { CONTINENT_COUNTRY_MAP, COUNTRY_CONTINENT_MAP };
