const backgrounds = new Map([
	["שנהב", "ivory"],
	["אבן", "stone"],
	["אפרסק", "peach"],
	["מרווה", "sage"],
	["צהוב", "butter"],
	["כחול", "blue"],
	["סגול", "lilac"],
	["כחול כהה", "navy"],
]);

export function getSectionBackground(value) {
	return typeof value === "string" ? backgrounds.get(value) : undefined;
}
