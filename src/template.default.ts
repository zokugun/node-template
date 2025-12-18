import { Template } from './template.class.js';
import { type TemplateContext } from './types.js';
import { substringBefore as $before } from './utils/substring-before.js';
import { toNumber as $number } from './utils/to-number.js';
import { unescapeCode as $unescape } from './utils/unescape-code.js';

export const template = new Template({
	block_open: {
		regex: /{{\/\s*([\s\S]+?)\s*}}/g,
		replace(this: TemplateContext, _match: string, code: string) {
			return '\';' + this.unescape(code) + '{out+=\'';
		},
	},
	block_close: {
		regex: /{{\\\\\s*([\s\S]+?)?\s*}}/g,
		replace(this: TemplateContext, _match: string, code?: string) {
			if(code) {
				return '\';}' + this.unescape(code) + ';out+=\'';
			}

			return '\';}out+=\'';
		},
	},
	comment: {
		regex: /{{--([\s\S]+?)--}}/g,
		replace() {
			return '';
		},
	},
	conditional: {
		regex: /{{\?(\?)?\s*([\s\S]*?)\s*}}/g,
		replace(this: TemplateContext, _match: string, elsecase?: string, code?: string) {
			if(elsecase) {
				if(code) {
					return '\';}else if(' + this.unescape(code) + '){out+=\'';
				}
				else {
					return '\';}else{out+=\'';
				}
			}
			else {
				if(code) {
					return '\';if(' + this.unescape(code) + '){out+=\'';
				}
				else {
					return '\';}out+=\'';
				}
			}
		},
	},
	encode: {
		regex: /{{!([\s\S]+?)}}/g,
		replace(this: TemplateContext, _match: string, code: string) {
			this.useEscape = true;

			return this.cse.startencode + this.unescape(code) + this.cse.endencode;
		},
	},
	evaluate: {
		regex: /{{\|([\s\S]+?)\|}}/g,
		replace(this: TemplateContext, _match: string, code: string) {
			return '\';' + $unescape(code.replaceAll(/\/\/.*\n/g, '\n').replaceAll(/\/\*([^*]|(\*+([^*/])))*\*\/+/g, '')) + 'out+=\'';
		},
	},
	function: {
		regex: /{{#\s*(?:([^}(]+)\s*(?:\(([^}]+)\)|\(\))?)?\s*}}/g,
		replace(this: TemplateContext, _match: string, name?: string, parameters?: string) {
			if(name) {
				if(name.includes('.') || name.includes('[')) {
					return '\';' + name + '=function(' + (parameters ?? '') + '){var out=\'';
				}
				else {
					return '\';var ' + name + '=function(' + (parameters ?? '') + '){var out=\'';
				}
			}
			else {
				return '\';return out;};out+=\'';
			}
		},
	},
	interpolate: {
		regex: /{{:([\s\S]+?)}}/g,
		replace(this: TemplateContext, _match: string, code: string) {
			return this.cse.start + this.unescape(code) + this.cse.end;
		},
	},
	iterate: {
		regex: /{{~\s*(?:}}|(~)?([\s\S]+?)\s*:\s*([\w$]*)\s*(?::\s*([\w$]+))?\s*}})/g,
		replace(this: TemplateContext, _match: string, desc?: string, iterate?: string, vname?: string, iname?: string) {
			if(!iterate) {
				return '\';}}out+=\'';
			}

			this.sid += 1;

			const indv = iname ?? `i${this.sid}`;
			const target = $unescape(iterate);

			if(vname) {
				if(desc) {
					return '\';var arr' + this.sid + '=' + target + ';if(arr' + this.sid + '){var ' + vname + ',' + indv + '=arr' + this.sid + '.length;while(' + indv + '>0){' + vname + '=arr' + this.sid + '[--' + indv + '];out+=\'';
				}
				else {
					return '\';var arr' + this.sid + '=' + target + ';if(arr' + this.sid + '){var ' + vname + ',' + indv + '=-1,l' + this.sid + '=arr' + this.sid + '.length-1;while(' + indv + '<l' + this.sid + '){' + vname + '=arr' + this.sid + '[++' + indv + '];out+=\'';
				}
			}
			else {
				if(desc) {
					return '\';var arr' + this.sid + '=' + target + ';if(arr' + this.sid + '){var ' + indv + '=arr' + this.sid + '.length;while(' + indv + '>0){--' + indv + ';out+=\'';
				}
				else {
					return '\';var arr' + this.sid + '=' + target + ';if(arr' + this.sid + '){var ' + indv + '=-1,l' + this.sid + '=arr' + this.sid + '.length-1;while(' + indv + '<l' + this.sid + '){++' + indv + ';out+=\'';
				}
			}
		},
	},
	oiterate: {
		regex: /{{\.\s*(?:}}|([\s\S]+?)\s*:\s*([\w$]*)\s*(?::\s*([\w$]+))?\s*}})/g,
		replace(this: TemplateContext, _match: string, iterate?: string, valueName?: string, keyName?: string) {
			if(!iterate) {
				return '\';}}out+=\'';
			}

			const object = `iter${++this.sid}`;
			const target = $unescape(iterate);

			if(valueName) {
				const finalKey = keyName ?? `i${this.sid}`;

				return '\';var ' + finalKey + ',' + valueName + ',' + object + '=' + target + ';if(' + object + '){for(' + finalKey + ' in ' + object + '){' + valueName + '=' + object + '[' + finalKey + '];out+=\'';
			}
			else {
				const finalKey = keyName ?? `i${this.sid}`;

				return '\';var ' + finalKey + ',' + object + '=' + target + ';if(' + object + '){for(' + finalKey + ' in ' + object + '){out+=\'';
			}
		},
	},
	postiterate: {
		regex: /{{\^\s*([\s\S]+?)\s*(?:}}|:\s*([\w$]+)\s*}})/g,
		replace(this: TemplateContext, _match: string, iterate: string, valueName?: string) {
			if(valueName) {
				return '\';var ' + valueName + '=' + $unescape(iterate) + ';do{out+=\'';
			}
			else {
				return '\';}while(' + $before(iterate, '.') + '=(' + $unescape(iterate) + '));out+=\'';
			}
		},
	},
	preiterate: {
		regex: /{{%\s*([\s\S]+?)\s*(?:}}|:\s*([\w$]+)\s*}})/g,
		replace(this: TemplateContext, _match: string, iterate: string, valueName?: string) {
			if(valueName) {
				return '\';var ' + valueName + '=' + $unescape(iterate) + ';while(' + valueName + '){out+=\'';
			}
			else {
				return '\';' + $before(iterate, '.') + '=' + $unescape(iterate) + ';}out+=\'';
			}
		},
	},
	range_open: {
		regex: /{{\[\s*([\w$]+)\s+([\s\S]+)\.\.([^}\s]+)\s*(?::\s*([\s\S]+)\s*)?]}}/g,
		replace(this: TemplateContext, _match: string, iname: string, from: string, to: string, step?: string) {
			const fromValue = $number(from);
			const toValue = $number(to);
			const stepValue = step ? $number(step) : 1;

			if(fromValue < toValue) {
				return '\';for(var ' + iname + ' = ' + $unescape(from) + '; ' + iname + ' <= ' + $unescape(to) + '; ' + (step ? iname + ' += ' + $unescape(step) : '++' + iname) + ') {out+=\'';
			}
			else if(fromValue > toValue) {
				return '\';for(var ' + iname + ' = ' + $unescape(from) + '; ' + iname + ' >= ' + $unescape(to) + '; ' + (step ? iname + ' -= ' + stepValue : '--' + iname) + ') {out+=\'';
			}
			else {
				const indv = 'l' + ++this.sid;
				let stepExpression = '++' + iname;

				if(step) {
					if(stepValue < 0) {
						stepExpression = stepValue === -1 ? '--' + iname : iname + ' -= ' + $unescape(step);
					}
					else {
						stepExpression = iname + ' += ' + $unescape(step);
					}
				}

				return '\';for(var ' + iname + ' = ' + $unescape(from) + ', ' + indv + ' = ' + $unescape(to) + '; ' + iname + ' < ' + indv + '; ' + stepExpression + ') {out+=\'';
			}
		},
	},
	range_close: {
		regex: /{{\[]}}/g,
		replace() {
			return '\';}out+=\'';
		},
	},
	zgreat_escape: {
		regex: /{{`([\s\S]*)}}/g,
		replace(_match: string, code: string) {
			return `{{${code}}}`;
		},
	},
});
