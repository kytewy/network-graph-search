/**
 * @jest-environment node
 */

import { createLatestRequest, isAbortError } from '@/lib/utils/latest-request';

describe('createLatestRequest', () => {
	it('cancels the previous request when a new one starts', () => {
		const requests = createLatestRequest();
		const first = requests.next();
		const second = requests.next();

		expect(first.aborted).toBe(true);
		expect(second.aborted).toBe(false);
	});

	it('cancel() stops the current request', () => {
		const requests = createLatestRequest();
		const signal = requests.next();
		requests.cancel();

		expect(signal.aborted).toBe(true);
	});

	it('cancel() with nothing running is safe', () => {
		expect(() => createLatestRequest().cancel()).not.toThrow();
	});
});

describe('isAbortError', () => {
	it('recognises a cancelled fetch', () => {
		const controller = new AbortController();
		controller.abort();
		expect(isAbortError(controller.signal.reason)).toBe(true);
		expect(isAbortError(Object.assign(new Error('x'), { name: 'AbortError' }))).toBe(true);
	});

	it('ignores other errors', () => {
		expect(isAbortError(new Error('Network error'))).toBe(false);
		expect(isAbortError(undefined)).toBe(false);
	});
});
