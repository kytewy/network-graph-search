'use client';

import { useCallback, useEffect, useRef } from 'react';

/** How far a list stretches past its end, at most, and how quickly it settles back */
export const RUBBER_BAND = { maxPx: 56, pull: 0.25, settleMs: 320, idleMs: 110 } as const;

/** The next stretch for one wheel step: it gets stiffer the further it has gone */
export function stretch(offset: number, deltaY: number): number {
	const room = 1 - Math.min(1, Math.abs(offset) / RUBBER_BAND.maxPx);
	const next = offset - deltaY * RUBBER_BAND.pull * room;
	return Math.max(-RUBBER_BAND.maxPx, Math.min(RUBBER_BAND.maxPx, next));
}

/** Adds the stretch-and-settle to one scroll box; returns how to take it off again */
export function attachRubberBand(box: HTMLElement): () => void {
	if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {};
	// The browser's own bounce (Mac) would double ours
	box.style.overscrollBehaviorY = 'none';
	let offset = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;
	const content = () => box.firstElementChild as HTMLElement | null;
	const settle = () => {
		const c = content();
		offset = 0;
		if (!c) return;
		c.style.transition = `transform ${RUBBER_BAND.settleMs}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
		c.style.transform = '';
	};
	const onWheel = (e: WheelEvent) => {
		const atTop = box.scrollTop < 1 && e.deltaY < 0;
		const atBottom = Math.ceil(box.scrollTop + box.clientHeight) >= box.scrollHeight - 1 && e.deltaY > 0;
		const c = content();
		if (!c || !(atTop || atBottom)) return;
		offset = stretch(offset, e.deltaY);
		c.style.transition = 'none';
		c.style.transform = `translateY(${offset}px)`;
		clearTimeout(timer);
		timer = setTimeout(settle, RUBBER_BAND.idleMs);
	};
	box.addEventListener('wheel', onWheel, { passive: true });
	return () => {
		box.removeEventListener('wheel', onWheel);
		clearTimeout(timer);
		settle();
	};
}

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
 * For a scrolling list: its ends stretch and spring back instead of stopping dead (Windows browsers
 * have no bounce of their own; off for "reduce motion"), and its scrollbar fades in only while you
 * scroll or hover (with the .fade-scroll class). Returns a ref for the scroll box: it attaches
 * whenever the box appears, after a loading state too.
 */
export function useRubberBand() {
	const detach = useRef<(() => void) | undefined>(undefined);
	useEffect(() => () => detach.current?.(), []);
	return useCallback((box: HTMLElement | null) => {
		detach.current?.();
		if (!box) return (detach.current = undefined);
		const off = [attachRubberBand(box), attachScrollActivity(box)];
		detach.current = () => off.forEach((f) => f());
	}, []);
}
