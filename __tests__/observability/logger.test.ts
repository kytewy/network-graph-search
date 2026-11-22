/**
 * @vitest-environment node
 */

/**
 * Server logs to PostHog over OpenTelemetry. Off without a token; when on,
 * records go to PostHog's OTLP logs endpoint with the project token.
 */

import { SeverityNumber } from '@opentelemetry/api';
import { InMemoryLogRecordExporter } from '@opentelemetry/sdk-logs';
import { createPostHogLogger, log, setLogger, logsEndpoint } from '@/lib/observability/logger';

afterEach(() => setLogger(null));

describe('log', () => {
	it('does nothing when no logger is set up', () => {
		expect(() => log.info('hello', { route: '/api' })).not.toThrow();
	});

	it('emits records with level, message and attributes', () => {
		const exporter = new InMemoryLogRecordExporter();
		setLogger(createPostHogLogger({ token: 'phc_test', exporter }));

		log.info('search done', { route: '/api/search', results: 10 });
		log.error('search failed', { route: '/api/search' });

		const records = exporter.getFinishedLogRecords();
		expect(records.map((r) => [r.severityNumber, r.severityText, r.body])).toEqual([
			[SeverityNumber.INFO, 'INFO', 'search done'],
			[SeverityNumber.ERROR, 'ERROR', 'search failed'],
		]);
		expect(records[0].attributes).toEqual({ route: '/api/search', results: 10 });
		expect(records[0].resource.attributes['service.name']).toBe('network-graph-search');
	});
});

describe('logsEndpoint', () => {
	it('uses the logs path on the configured PostHog host', () => {
		expect(logsEndpoint('https://us.i.posthog.com')).toBe('https://us.i.posthog.com/i/v1/logs');
		expect(logsEndpoint('https://eu.i.posthog.com/')).toBe('https://eu.i.posthog.com/i/v1/logs');
	});
});
