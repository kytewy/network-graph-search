'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Apple's rubber band: b = (1 - 1 / (x·c/d + 1))·d, with c = 0.55 (UIScrollView's constant) and d the
 * box's height, so pulling further gives less and less. A wheel step counts half (it isn't a finger).
 * The stretch follows quickly, and lets go almost at once with a fast ease-out that doesn't overshoot.
 */
export const RUBBER_BAND = { coefficient: 0.55, wheelShare: 0.5, followMs: 90, settleMs: 380, idleMs: 50 } as const;

/** How far the list shows stretched after pulling `pulled` pixels past its end, in a box `height` tall */
export function stretch(pulled: number, height: number): number {
	const d = Math.max(1, height);
	return (1 - 1 / ((Math.abs(pulled) * RUBBER_BAND.coefficient) / d + 1)) * d * Math.sign(pulled);
}

/** Adds the stretch-and-settle to one scroll box; returns how to take it off again */
export function attachRubberBand(box: HTMLElement): () => void {
	if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {};
	// The browser's own bounce (Mac) would double ours
	box.style.overscrollBehaviorY = 'none';
	let pulled = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;
	const content = () => box.firstElementChild as HTMLElement | null;
	const settle = () => {
		const c = content();
		pulled = 0;
		if (!c) return;
		// Fast at first, then gently into place: like a critically damped spring, no bounce past it
		c.style.transition = `transform ${RUBBER_BAND.settleMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;
		c.style.transform = '';
	};
	const onWheel = (e: WheelEvent) => {
		const atTop = box.scrollTop < 1 && e.deltaY < 0;
		const atBottom = Math.ceil(box.scrollTop + box.clientHeight) >= box.scrollHeight - 1 && e.deltaY > 0;
		const c = content();
		if (!c || !(atTop || atBottom)) return;
		pulled -= e.deltaY * RUBBER_BAND.wheelShare;
		c.style.transition = `transform ${RUBBER_BAND.followMs}ms ease-out`;
		c.style.transform = `translateY(${stretch(pulled, box.clientHeight)}px)`;
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
