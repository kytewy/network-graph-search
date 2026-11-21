'use client';

import { useEffect, useState } from 'react';
import { Label, type ClusterRendererProps } from 'reagraph';
import { CLUSTER_NAME_FADE_MS, CLUSTER_RING_COLORS } from '@/lib/config/graph-colors';
import type { ContextLevel } from '@/lib/clustering/cluster-display';

interface ClusterRingProps extends ClusterRendererProps {
	name: string;
	level: ContextLevel;
}

/** Goes from 0 to 1 over the fade time each time `key` changes. */
function useFadeIn(key: string) {
	const [progress, setProgress] = useState(1);
	useEffect(() => {
		let frame = 0;
		const start = performance.now();
		const step = (now: number) => {
			const p = Math.min(1, (now - start) / CLUSTER_NAME_FADE_MS);
			setProgress(p);
			if (p < 1) frame = requestAnimationFrame(step);
		};
		setProgress(0);
		frame = requestAnimationFrame(step);
		return () => cancelAnimationFrame(frame);
	}, [key]);
	return progress;
}

/**
 * One cluster's ring and name. Drawn by us so its colour and name can change
 * without touching the nodes, which would make reagraph re-run the layout.
 */
export function ClusterRing({ name, level, label, opacity, outerRadius, innerRadius, padding, theme }: ClusterRingProps) {
	const fade = useFadeIn(name);
	const labelTheme = theme?.cluster?.label;

	return (
		<>
			<mesh>
				<ringGeometry attach="geometry" args={[outerRadius, innerRadius + padding, 128]} />
				<meshBasicMaterial
					attach="material"
					color={CLUSTER_RING_COLORS[level]}
					transparent
					depthTest={false}
					opacity={opacity}
				/>
			</mesh>
			{label && labelTheme && (
				<group position={label.position}>
					<Label
						text={name}
						opacity={opacity * fade}
						fontUrl={label.fontUrl}
						stroke={labelTheme.stroke}
						color={labelTheme.color}
						fontSize={labelTheme.fontSize ?? 12}
						active={false}
					/>
				</group>
			)}
		</>
	);
}
