const HTML_REGEX = /&(?!#?\w+;)|<|>|"|'|\//g;
const ENCODE_HTML_RULES: Record<string, string> = {
	'&': '&#38;',
	'<': '&#60;',
	'>': '&#62;',
	'"': '&#34;',
	'\'': '&#39;',
	'/': '&#47;',
};

function replaceMap(m: string): string {
	return ENCODE_HTML_RULES[m] ?? m;
}

export function escapeHtml(value?: string): string {
	if(typeof value !== 'string') {
		return '';
	}

	return String(value).replaceAll(HTML_REGEX, replaceMap);
}
