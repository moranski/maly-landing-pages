import { defineLiveCollection } from "astro:content";
import { emdashLoader } from "emdash/runtime";

/** Makes published EmDash entries available through Astro Live Content Collections. */
export const collections = {
	_emdash: defineLiveCollection({ loader: emdashLoader() }),
};
