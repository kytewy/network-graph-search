import { SeverityNumber, type Logger } from '@opentelemetry/api';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
	LoggerProvider,
	SimpleLogRecordProcessor,
	type LogRecordExporter,
} from '@opentelemetry/sdk-logs';
import { POSTHOG_DEFAULT_HOST } from '@/lib/observability/posthog-server';

const SERVICE_NAME = 'network-graph-search';

type Attributes = Record<string, string | number | boolean | undefined>;

let logger: Logger | null = null;

/** PostHog's OpenTelemetry logs endpoint for a host. */
export function logsEndpoint(host: string): string {
	return `${host.replace(/\/+$/, '')}/i/v1/logs`;
}

/** Builds an OpenTelemetry logger that ships each record to PostHog Logs. */
export function createPostHogLogger({
	token,
	host = POSTHOG_DEFAULT_HOST,
	exporter,
}: {
	token: string;
	host?: string;
	exporter?: LogRecordExporter; // tests pass an in-memory exporter
}): Logger {
	const provider = new LoggerProvider({
		resource: resourceFromAttributes({ 'service.name': SERVICE_NAME }),
		processors: [
			new SimpleLogRecordProcessor({
				exporter:
					exporter ??
					new OTLPLogExporter({
						url: logsEndpoint(host),
						headers: { Authorization: `Bearer ${token}` },
					}),
			}),
		],
	});
	return provider.getLogger(SERVICE_NAME);
}

/** Called once from instrumentation.ts; null turns logging off. */
export function setLogger(next: Logger | null) {
	logger = next;
}

function emit(severityNumber: SeverityNumber, severityText: string, body: string, attributes?: Attributes) {
	logger?.emit({ severityNumber, severityText, body, attributes });
}

/** Server logs. A no-op until PostHog logging is set up. */
export const log = {
	info: (message: string, attributes?: Attributes) =>
		emit(SeverityNumber.INFO, 'INFO', message, attributes),
	warn: (message: string, attributes?: Attributes) =>
		emit(SeverityNumber.WARN, 'WARN', message, attributes),
	error: (message: string, attributes?: Attributes) =>
		emit(SeverityNumber.ERROR, 'ERROR', message, attributes),
};
