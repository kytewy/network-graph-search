import { citedId, documentTitle, findCitations, linkCitations, matchCitation, toPlainText } from '@/lib/chat/citations';

const docs = [
	{ id: 'eu', label: 'EU AI Act' },
	{ id: 'osfi', label: 'OSFI Guideline E-23: Model Risk Management' },
	{ id: 'a76', label: 'Article 76: Supervision Testing in Real World Conditions by Market Surveillance Authorities' },
];

describe('findCitations', () => {
	it('finds each cited name once, in order, skipping links, images and checkboxes', () => {
		const answer = 'See [EU AI Act] and [OSFI Guideline E-23]. Again [EU AI Act]. A [link](https://x.y), ![img](a.png), - [ ] todo, - [x] done';
		expect(findCitations(answer)).toEqual(['EU AI Act', 'OSFI Guideline E-23']);
	});
});

describe('matchCitation', () => {
	it('matches the same title regardless of case, bold and punctuation', () => {
		expect(matchCitation('**eu ai act**', docs)?.id).toBe('eu');
	});

	it('matches a shortened title, or one with extra words', () => {
		expect(matchCitation('OSFI Guideline E-23', docs)?.id).toBe('osfi');
		expect(matchCitation('Article 76', docs)?.id).toBe('a76');
		expect(matchCitation('EU AI Act (2024)', docs)?.id).toBe('eu');
	});

	it('returns nothing for an unknown name', () => {
		expect(matchCitation('GDPR', docs)).toBeNull();
	});
});

describe('linkCitations', () => {
	it('turns matched citations into cite links and leaves the rest alone', () => {
		const linked = linkCitations('Per [EU AI Act] and [GDPR].', docs);
		expect(linked).toBe('Per [EU AI Act](#cite-eu) and [GDPR].');
		expect(citedId('#cite-eu')).toBe('eu');
		expect(citedId('https://example.com')).toBeNull();
	});
});

describe('documentTitle', () => {
	it('uses the first heading, else the question, kept short', () => {
		expect(documentTitle('Intro\n## **Bank impact memo**\nText', 'q')).toBe('Bank impact memo');
		expect(documentTitle('No heading here', 'How do these affect banks?')).toBe('How do these affect banks?');
		expect(documentTitle('', 'x'.repeat(100))).toHaveLength(68);
	});
});

describe('toPlainText', () => {
	it('drops markdown marks but keeps the words', () => {
		expect(toPlainText('## Title\n**Bold** and *it* with [EU AI Act](#cite-eu) and `code`')).toBe('Title\nBold and it with EU AI Act and code');
	});
});
