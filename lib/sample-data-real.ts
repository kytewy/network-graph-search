export interface Node {
	id: string;
	label: string;
	type: string;
	size: number;
	color: string;
	summary: string;
	content: string;
	similarity?: number;
	continent: string;
	country: string;
	stateProvince: string | null;
	sourceType: string;
	url: string;
	x?: number;
	y?: number;
	vx?: number;
	vy?: number;
}

export interface Link {
	source: string;
	target: string;
	type: string;
	strength: number;
}

// Function to load and parse the recitals and articles from the JSON files
import recitalsData from '../test_recitals_1_to_180.json';
import articlesData from '../articles_limited.json';

// Define color mapping for different node types
const nodeColors = {
	recital: '#15803d', // Green color for recitals
	article: '#8b5cf6', // Purple color for articles
};

// Convert recitals to nodes
export const realNodes: Node[] = [
	// Convert recitals to nodes
	...recitalsData.recitals.map((recital: any) => ({
		id: recital.id,
		label: recital.title,
		type: 'recital',
		size: 15, // Medium size for recitals
		color: nodeColors.recital,
		summary:
			recital.content.substring(0, Math.min(150, recital.content.length)) +
			'...',
		content: recital.content,
		similarity: Math.floor(Math.random() * 30) + 60, // Random similarity between 60-90
		continent: recital.continent,
		country: 'European Union',
		stateProvince: null,
		sourceType: recital.sourceType,
		url: recital.url,
	})),

	// Convert articles to nodes
	...articlesData.map((article: any) => ({
		id: article.id,
		label: article.title,
		type: 'article',
		size: 18, // Larger size for articles
		color: nodeColors.article,
		summary:
			article.summary ||
			(article.content
				? article.content.substring(0, Math.min(150, article.content.length)) +
				  '...'
				: 'No summary available'),
		content: article.content || 'No content available',
		similarity: Math.floor(Math.random() * 20) + 70, // Random similarity between 70-90
		continent: article.continent,
		country: 'European Union',
		stateProvince: null,
		sourceType: article.sourceType,
		url: article.url,
	})),
];

// Create links based on the connected_to property in articles
export const realLinks: Link[] = [];

// Process each article to create links
articlesData.forEach((article: any) => {
	if (article.connected_to && Array.isArray(article.connected_to)) {
		article.connected_to.forEach((targetId: string) => {
			realLinks.push({
				source: article.id,
				target: targetId,
				type: 'reference',
				strength: 3, // Default strength for references
			});
		});
	}
});

// Add some additional links between recitals for better network connectivity
// This is optional and can be adjusted based on your needs
for (let i = 1; i < Math.min(recitalsData.recitals.length, 30); i++) {
	// Connect some recitals to each other (e.g., R1 to R2, R2 to R3, etc.)
	realLinks.push({
		source: `R${i}`,
		target: `R${i + 1}`,
		type: 'sequence',
		strength: 2,
	});

	// Add some cross-connections for a more interesting graph
	if (i % 5 === 0 && i + 3 < recitalsData.recitals.length) {
		realLinks.push({
			source: `R${i}`,
			target: `R${i + 3}`,
			type: 'related',
			strength: 1,
		});
	}
}
