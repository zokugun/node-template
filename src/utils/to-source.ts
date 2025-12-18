import { type CurriedFunction } from './curry.js';

const ANONYMOUS_REGEX = /^function anonymous\(/;
const MULTILINE_PARAMETERS = /^(function\([^)\r\n]*)([\r\n])+/gim;

export function toSource(value: unknown): string {
	if(typeof value === 'string') {
		return JSON.stringify(value);
	}

	if(typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}

	if(value === undefined) {
		return 'undefined';
	}

	if(value === null) {
		return 'null';
	}

	if(typeof value === 'function') {
		const curriedFunction = value as CurriedFunction;

		if(curriedFunction.__original) {
			return toSource(curriedFunction.__original);
		}

		let source = value.toString();

		source = source.replace(ANONYMOUS_REGEX, 'function(');

		let match: RegExpExecArray | null;
		while((match = MULTILINE_PARAMETERS.exec(source)) !== null) {
			const headerLength = match[1]?.length ?? 0;
			const newLineLength = match[2]?.length ?? 0;

			source = source.slice(0, headerLength) + source.slice(Math.max(0, headerLength + newLineLength));
		}

		return source;
	}

	if(value instanceof RegExp) {
		return value.toString();
	}

	if(Array.isArray(value)) {
		if(value.length > 0) {
			return `[${value.map(toSource).join(',')}]`;
		}
		else {
			return '[]';
		}
	}

	if(typeof value === 'object') {
		if(value.constructor) {
			const sources: string[] = [];

			for(const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
				if(Object.hasOwn(value, key)) {
					sources.push(`"${key}":${toSource(entryValue)}`);
				}
			}

			return `{${sources.join(',')}}`;
		}
		else {
			const sources: string[] = [];

			for(const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
				sources.push(`"${key}":${toSource(entryValue)}`);
			}

			return `{${sources.join(',')}}`;
		}
	}

	return JSON.stringify(value);
}
