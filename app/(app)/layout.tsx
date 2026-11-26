import type React from 'react';
import { AppSidebar } from '@/components/shell/AppSidebar';

/** Every page inside the app gets Lantern's sidebar on the left. */
export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="flex h-screen overflow-clip">
			<AppSidebar />
			<div className="flex-1 min-w-0 h-screen">{children}</div>
		</div>
	);
}
