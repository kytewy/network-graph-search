'use client';

import { Ring, Sphere, type NodeRendererProps } from 'reagraph';
import { nodeRingStyle } from '@/lib/config/graph-colors';

/** Just outside the ball (the ring's radius is innerRadius × size / 2). */
const RING_INNER_RADIUS = 2.3;

/**
 * Reagraph's usual node ball, with a ring around it that shows whether the
 * document is in your context. The ball keeps its own colour (purple only
 * while hovered), so you can still see its publisher, country or type.
 */
export function NodeWithRing({ inContext, ...props }: NodeRendererProps & { inContext: boolean }) {
	const ring = nodeRingStyle(inContext);
	return (
		<>
			<Sphere {...props} />
			<Ring
				color={ring.color}
				size={props.size}
				opacity={props.opacity}
				animated={props.animated}
				innerRadius={RING_INNER_RADIUS}
				strokeWidth={ring.strokeWidth}
			/>
		</>
	);
}
