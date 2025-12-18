export function isObject(value: unknown): value is Object {
	return typeof value === 'object' && !Array.isArray(value);
}
