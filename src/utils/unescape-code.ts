export function unescapeCode(code: string): string {
	return code.replaceAll(/\\('|\\)/g, '$1').replaceAll(/[\r\t\n]/g, ' ');
}
