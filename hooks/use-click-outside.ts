/**
 * useClickOutside Hook
 *
 * Reusable hook for detecting clicks outside of a referenced element.
 * Commonly used for closing modals, menus, and dropdowns.
 *
 * @example
 * ```tsx
 * const menuRef = useRef<HTMLDivElement>(null);
 * useClickOutside(menuRef, () => setMenuOpen(false));
 * ```
 */

import { useEffect, RefObject } from 'react';

/**
 * Hook that triggers a callback when clicking outside the referenced element
 *
 * @param ref - React ref object pointing to the element to monitor
 * @param handler - Callback function to execute when clicking outside
 * @param enabled - Optional flag to enable/disable the listener (default: true)
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
	ref: RefObject<T>,
	handler: (event: MouseEvent | TouchEvent) => void,
	enabled: boolean = true
): void {
	useEffect(() => {
		// Don't set up listener if disabled
		if (!enabled) {
			return;
		}

		const handleClickOutside = (event: MouseEvent | TouchEvent) => {
			// Do nothing if clicking ref's element or descendent elements
			if (!ref.current || ref.current.contains(event.target as Node)) {
				return;
			}

			handler(event);
		};

		// Bind the event listeners
		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('touchstart', handleClickOutside);

		// Cleanup function
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('touchstart', handleClickOutside);
		};
	}, [ref, handler, enabled]);
}

/**
 * Alternative version that accepts multiple refs
 * Useful when you have multiple elements that should not trigger the callback
 *
 * @example
 * ```tsx
 * const menuRef = useRef<HTMLDivElement>(null);
 * const buttonRef = useRef<HTMLButtonElement>(null);
 * useClickOutsideMultiple([menuRef, buttonRef], () => setMenuOpen(false));
 * ```
 */
export function useClickOutsideMultiple<T extends HTMLElement = HTMLElement>(
	refs: RefObject<T>[],
	handler: (event: MouseEvent | TouchEvent) => void,
	enabled: boolean = true
): void {
	useEffect(() => {
		if (!enabled) {
			return;
		}

		const handleClickOutside = (event: MouseEvent | TouchEvent) => {
			// Check if click is outside all refs
			const clickedOutsideAll = refs.every(
				(ref) => !ref.current || !ref.current.contains(event.target as Node)
			);

			if (clickedOutsideAll) {
				handler(event);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('touchstart', handleClickOutside);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('touchstart', handleClickOutside);
		};
	}, [refs, handler, enabled]);
}
