import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: "../backend/static"
		}),
		alias: {
			"$types/*": "../types/*",
			"$shared/*": "../shared/*"
		}
	},
	compilerOptions: {
		warningFilter: (warning) => warning.code !== "state_referenced_locally"
	}
};

export default config;
