import { getDatabase } from "@/lib/notion/client";
import type { SiteConfig } from "@/types";
import { AUTHOR, WEBMENTION_LINK, HOME_PAGE_SLUG } from "@/constants";

const database = await getDatabase();

const siteTitle = database.Title;
const siteDescription = database.Description;

export const siteInfo: SiteConfig = {
	title: siteTitle,
	description: siteDescription,
	author: AUTHOR,
	lang: "en",
	homePageSlug: HOME_PAGE_SLUG,
	ogLocale: "en",
	date: {
		locale: "en",
		options: {
			day: "numeric",
			month: "short",
			year: "numeric",
		},
	},
	webmentions: {
		link: WEBMENTION_LINK,
	},
	logo: database.Icon || null,
};
