/**
 * Debug logging that is silent by default.
 *
 * Set NEXT_PUBLIC_DEBUG=true (e.g. in .env.local) to see these logs in the
 * browser console and server output. Use console.error / console.warn for
 * real problems; they always print.
 */
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

export function debugLog(...args: unknown[]) {
	if (DEBUG) console.log(...args);
}
