'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddLinkDialog } from './AddLinkDialog';

/** "+ Add a link": a button on Sources, a small text link under the search box. Refreshes the page's data once added. */
export function AddLinkButton({ variant = 'button' }: { variant?: 'button' | 'link' }) {
	const router = useRouter();
	const trigger =
		variant === 'button' ? (
			<Button><Plus className="size-4" aria-hidden="true" />Add a link</Button>
		) : (
			<button type="button" className="text-xs text-primary hover:underline">+ Add a link</button>
		);
	return <AddLinkDialog trigger={trigger} onAdded={() => router.refresh()} />;
}
