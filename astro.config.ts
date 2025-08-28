import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

import path from "path";
import { CUSTOM_DOMAIN, BASE_PATH } from "./src/constants";
const getSite = function () {
	if (CUSTOM_DOMAIN) {
		return new URL(BASE_PATH || "/", `https://${CUSTOM_DOMAIN}`).toString();
	}
	if (process.env.VERCEL && process.env.VERCEL_URL) {
		return new URL(BASE_PATH || "/", `https://${process.env.VERCEL_URL}`).toString();
	}
	if (process.env.CF_PAGES) {
		if (process.env.CF_PAGES_BRANCH !== "main") {
			return new URL(BASE_PATH || "/", process.env.CF_PAGES_URL).toString();
		}
		return new URL(
			BASE_PATH || "/",
			`https://${new URL(process.env.CF_PAGES_URL).host.split(".").slice(1).join(".")}`,
		).toString();
	}
	if (process.env.GITHUB_PAGES) {
		return new URL(process.env.BASE || BASE_PATH || "/", process.env.SITE).toString();
	}
	return new URL(BASE_PATH || "/", "http://localhost:4321").toString();
};
import CustomIconDownloader from "./src/integrations/custom-icon-downloader";
import EntryCacheEr from "./src/integrations/entry-cache-er";
import PublicNotionCopier from "./src/integrations/public-notion-copier";
import blocksHtmlCacher from "./src/integrations/block-html-cache-er";
import buildTimestampRecorder from "./src/integrations/build-timestamp-recorder";
import rssContentEnhancer from "./src/integrations/rss-content-enhancer";
import CSSWriter from "./src/integrations/theme-constants-to-css";
import createFoldersIfMissing from "./src/integrations/create-folders-if-missing";
import robotsTxt from "astro-robots-txt";
import config from "./constants-config.json";
import partytown from "@astrojs/partytown";
const key_value_from_json = {
	...config,
};
function modifyRedirectPaths(
	redirects: Record<string, string>,
	basePath: string,
): Record<string, string> {
	const modifiedRedirects: Record<string, string> = {};

	// Normalize basePath: ensure it starts with "/" and remove trailing slash.
	if (!basePath.startsWith("/")) {
		basePath = "/" + basePath;
	}
	basePath = basePath.replace(/\/+$/, ""); // remove trailing slashes

	for (const [key, value] of Object.entries(redirects)) {
		// If it's an external URL, leave it unchanged.
		if (value.startsWith("http://") || value.startsWith("https://")) {
			modifiedRedirects[key] = value;
			continue;
		}

		// Ensure value starts with a slash.
		let normalizedValue = value.startsWith("/") ? value : "/" + value;
		modifiedRedirects[key] = path.posix.join(basePath, normalizedValue);
	}

	return modifiedRedirects;
}

// https://astro.build/config
export default defineConfig({
	site: "https://www.reelikklemind.com",
	base: process.env.BASE || BASE_PATH,
	redirects: key_value_from_json["redirects"]
		? modifyRedirectPaths(key_value_from_json["redirects"], process.env.BASE || BASE_PATH)
		: {},
	integrations: [
		createFoldersIfMissing(),
		buildTimestampRecorder(),
		EntryCacheEr(),
		CustomIconDownloader(),
		CSSWriter(),
		partytown({
			// Adds dataLayer.push as a forwarding-event.
			config: {
				forward: ["dataLayer.push"],
			},
		}),
		robotsTxt(),
		rssContentEnhancer(),
		blocksHtmlCacher(),
		PublicNotionCopier(),
		sitemap({
			// Generate sitemap during build - replaces external GitHub action
			filter: (page) => !page.includes("/admin/") && !page.includes("/api/"),
			customPages: ["/"],
		}),
	],
	image: {
		domains: ["webmention.io"],
		// Enable image optimization for better performance
		service: {
			entrypoint: "astro/assets/services/sharp",
		},
	},
	prefetch: true,
	vite: {
		plugins: [tailwindcss()],
		optimizeDeps: {
			exclude: ["@resvg/resvg-js"],
			force: true, // Force rebuild for faster dependency optimization
		},
		build: {
			sourcemap: false, // Disable sourcemaps for faster production builds
			minify: "terser", // Use Terser for minification
			chunkSizeWarningLimit: 2000, // Increase chunk size limit for large sites
			rollupOptions: {
				output: {
					// Optimize code splitting for large websites
					manualChunks: {
						// Core Astro framework
						astro: ["astro"],
						// Partytown for third-party scripts
						partytown: ["@astrojs/partytown"],
						// Notion-related packages
						notion: ["@notionhq/client", "@atproto/api"],
						// UI/UX libraries
						ui: ["katex", "mermaid"],
						// Image processing
						images: ["sharp", "exif-be-gone"],
						// RSS and XML processing
						xml: ["fast-xml-parser", "@astrojs/rss"],
						// Utility libraries
						utils: ["axios", "async-retry", "superjson"],
					},
				},
			},
		},
		// Additional performance optimizations
		resolve: {
			alias: {
				// Optimize imports
			},
		},
		// Enable CSS optimization
		css: {
			devSourcemap: false,
			transformer: "lightningcss",
		},
	},
});
