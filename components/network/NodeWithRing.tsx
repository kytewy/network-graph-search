'use client';

import { Ring, Sphere, type NodeRendererProps } from 'reagraph';
import { nodeFill, nodeRingStyle } from '@/lib/config/graph-colors';
import { GRAPH_THEME } from './graph-theme';

/** Just outside the ball (the ring's radius is innerRadius × size / 2). */
const RING_INNER_RADIUS = 2.3;

/**
 * Reagraph's usual node ball, with a ring around it that shows whether the
 * document is in your context. The ball keeps its own colour (purple only
 * while hovered), so you can still see its publisher, country or type.
 */
type Props = NodeRendererProps & { inContext: boolean; hovered: boolean };

export function NodeWithRing({ inContext, hovered, ...props }: Props) {
	const ring = nodeRingStyle(inContext);
	// Our own hover state, not reagraph's: reagraph treats a quick click as a
	// drag and leaves the node marked active (purple) after the mouse leaves.
	const color = nodeFill(hovered, props.node.fill, String(GRAPH_THEME.node.fill));
	return (
		<>
			<Sphere {...props} color={color} />
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
