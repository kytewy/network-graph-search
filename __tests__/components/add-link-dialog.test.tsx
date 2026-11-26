import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const previewLink = vi.fn();
const addLink = vi.fn();
vi.mock('@/lib/api/sources-client', () => ({ previewLink: (u: string) => previewLink(u), addLink: (r: unknown) => addLink(r) }));
vi.mock('next/link', () => ({ default: ({ children, ...p }: { children: React.ReactNode; href: string }) => <a {...p}>{children}</a> }));

import { AddLinkDialog } from '@/components/sources/AddLinkDialog';

const URL = 'https://ised-isde.canada.ca/aida';
const PREVIEW = { url: URL, title: 'AIDA companion document', siteName: 'Canada.ca', length: 31_200, excerpt: 'This page has been archived.' };

function openAndPreview() {
	render(<AddLinkDialog trigger={<button>Add a link</button>} />);
	fireEvent.click(screen.getByRole('button', { name: 'Add a link' }));
	fireEvent.change(screen.getByPlaceholderText('https://…'), { target: { value: URL } });
	fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
}

beforeEach(() => {
	previewLink.mockReset();
	addLink.mockReset();
});

describe('AddLinkDialog', () => {
	it('previews the page, then adds it with the chosen labels', async () => {
		previewLink.mockResolvedValue(PREVIEW);
		addLink.mockResolvedValue({ id: 'link-1', title: 'AIDA companion document', created: true, length: 31_200 });
		openAndPreview();
		expect(await screen.findByDisplayValue('AIDA companion document')).toBeTruthy();
		expect(screen.getByText(/Canada\.ca · 31,200 characters/)).toBeTruthy();

		const add = screen.getByRole('button', { name: 'Add' }) as HTMLButtonElement;
		expect(add.disabled).toBe(true);
		fireEvent.change(screen.getByLabelText('Publisher'), { target: { value: 'Government' } });
		fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'Guidance' } });
		fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'Canada' } });
		fireEvent.click(add);

		await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Added'));
		expect(addLink).toHaveBeenCalledWith({
			url: URL, title: 'AIDA companion document', publisher: 'Government', documentType: 'Guidance', country: 'Canada', continent: 'North America',
		});
	});

	it('says so when the link is already in Sources', async () => {
		previewLink.mockResolvedValue(PREVIEW);
		addLink.mockResolvedValue({ id: 'link-1', title: 'AIDA companion document', created: false, length: 1 });
		openAndPreview();
		await screen.findByDisplayValue('AIDA companion document');
		fireEvent.change(screen.getByLabelText('Publisher'), { target: { value: 'Government' } });
		fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'Guidance' } });
		fireEvent.click(screen.getByRole('button', { name: 'Add' }));
		await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Already in Sources'));
	});

	it('shows the server’s reason when a link can’t be previewed', async () => {
		previewLink.mockRejectedValue(new Error('Links to private or local addresses can’t be added'));
		openAndPreview();
		expect((await screen.findByRole('alert')).textContent).toMatch(/private or local/);
	});
});
