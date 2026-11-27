'use client';

import { useCallback, useEffect, useRef } from 'react';

/** Marks the box as scrolling while it scrolls (and a moment after), so its scrollbar fades in */
export function attachScrollActivity(box: HTMLElement): () => void {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const onScroll = () => {
		box.dataset.scrolling = '';
		clearTimeout(timer);
		timer = setTimeout(() => delete box.dataset.scrolling, 900);
	};
	box.addEventListener('scroll', onScroll, { passive: true });
	return () => {
		box.removeEventListener('scroll', onScroll);
		clearTimeout(timer);
	};
}

/**
 * For a scrolling list with the .fade-scroll class: its scrollbar fades in only while you scroll or
 * hover. Returns a ref for the scroll box: it attaches whenever the box appears, after a loading state too.
 */
export function useScrollActivity() {
	const detach = useRef<(() => void) | undefined>(undefined);
	useEffect(() => () => detach.current?.(), []);
	return useCallback((box: HTMLElement | null) => {
		detach.current?.();
		detach.current = box ? attachScrollActivity(box) : undefined;
	}, []);
}
