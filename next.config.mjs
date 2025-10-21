/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		unoptimized: true,
	},
	// Enable standalone output for Docker
	output: 'standalone',
	// Experimental features for better Docker support
	experimental: {
		outputFileTracingRoot: process.cwd(),
	},
	// Enable webpack polling for Docker on Windows
	// This allows Next.js to detect file changes in Docker volumes
	webpack: (config, { dev }) => {
		if (dev) {
			config.watchOptions = {
				poll: 500, // Check for changes every second
				aggregateTimeout: 200, // Delay before rebuilding
			};
		}
		return config;
	},
};

export default nextConfig;
