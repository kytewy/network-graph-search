import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { PublisherFilters } from '@/components/filters/PublisherFilters';

describe('PublisherFilters', () => {
	const setup = (selected: string[] = []) => {
		const togglePublisher = vi.fn();
		render(
			<PublisherFilters
				availablePublishers={['Government', 'Law firm']}
				selectedPublishers={selected}
				togglePublisher={togglePublisher}
				getNodeCountByPublisher={(p) => (p === 'Law firm' ? 2 : 5)}
			/>
		);
		return togglePublisher;
	};

	it('shows each publisher with its count and selection state', () => {
		setup(['Law firm']);
		expect(screen.getByRole('checkbox', { name: /Government \(5\)/ })).toHaveAttribute('aria-checked', 'false');
		expect(screen.getByRole('checkbox', { name: /Law firm \(2\)/ })).toHaveAttribute('aria-checked', 'true');
	});

	it('toggles on click and with the keyboard', () => {
		const togglePublisher = setup();
		fireEvent.click(screen.getByRole('checkbox', { name: /Government/ }));
		fireEvent.keyDown(screen.getByRole('checkbox', { name: /Law firm/ }), { key: 'Enter' });
		expect(togglePublisher.mock.calls).toEqual([['Government'], ['Law firm']]);
	});
});
