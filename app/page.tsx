import { redirect } from 'next/navigation';

// The graph explorer is the app's only page, so `/` goes straight there
export default function Home() {
	redirect('/graph');
}
