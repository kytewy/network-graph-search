/** Lantern's mark: a small lantern outline in the "lit" amber. */
export function LanternMark({ className = 'size-[18px]' }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`${className} text-lit`}>
			<path d="M9 3h6" />
			<path d="M12 3v2" />
			<path d="M7 7h10l-1.2 11H8.2z" />
			<path d="M10 21h4" />
			<path d="M12 10.5v4" />
		</svg>
	);
}
