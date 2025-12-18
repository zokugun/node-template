export function substringAfter(value: string, search: string): string {
	const index = value.indexOf(search);
	return index === -1 ? '' : value.slice(index + search.length);
}
