/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		// ESLint isn't configured for this project yet; type errors still fail the build.
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: false,
	},
	images: {
		unoptimized: true,
	},
	webpack: (config, { dev }) => {
		if (dev) {
			config.watchOptions = {
				poll: 1000,
				aggregateTimeout: 300,
				ignored: [
					'**/node_modules/**',
					'**/.next/**',
					'**/.git/**',
					'**/backend/**',
				],
			};
		}
		return config;
	},
};

export default nextConfig;
