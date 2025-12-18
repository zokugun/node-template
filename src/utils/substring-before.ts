export function substringBefore(value: string, search: string, fromEnd: boolean = false): string {
	const index = fromEnd ? value.lastIndexOf(search) : value.indexOf(search);
	return index === -1 ? value : value.slice(0, index);
}
