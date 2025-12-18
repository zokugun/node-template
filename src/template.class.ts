import { type CompiledTemplate, type Replacer, type StartEndConfig, type TagHandler, type TemplateContext, type TemplateInitOptions, type TemplateOptions, type TemplateTags } from './types.js';
import { curry } from './utils/curry.js';
import { escapeHtml } from './utils/escape-html.js';
import { isObject } from './utils/is-object.js';
import { substringAfter } from './utils/substring-after.js';
import { substringBefore } from './utils/substring-before.js';
import { toSource } from './utils/to-source.js';
import { unescapeCode } from './utils/unescape-code.js';

/* eslint-disable no-new-func -- Dynamic template compilation requires Function constructor usage. */

const COMMENT_REGEX = /<!--.*-->/g;

const DEFAULT_OPTIONS: Required<Pick<TemplateOptions, 'varnames' | 'strip' | 'append' | 'allowsCurrying'>> = {
	varnames: 'it',
	strip: true,
	append: true,
	allowsCurrying: true,
};

const NOOP = function () { // {{{
	return '';
}; // }}}

const START_END: StartEndConfig = {
	curry: {
		append: {
			start: '\'+(',
			end: ')+\'',
			startencode: '\'+escape(',
			endencode: ')+\'',
		},
		split: {
			start: '\';out+=(',
			end: ');out+=\'',
			startencode: '\';out+=escape(',
			endencode: ');out+=\'',
		},
	},
	noncurry: {
		append: {
			start: '\'+(',
			end: ')+\'',
			startencode: '\'+(',
			endencode: ')+\'',
		},
		split: {
			start: '\';out+=(',
			end: ');out+=\'',
			startencode: '\';out+=(',
			endencode: ');out+=\'',
		},
	},
};

export class Template {
	private readonly options: TemplateOptions;
	private readonly varnames?: string;
	private readonly variables: unknown[] = [];
	private replace: Replacer;
	private tags: TemplateTags;

	constructor(tags?: TemplateTags, options?: TemplateInitOptions) { // {{{
		options = { ...DEFAULT_OPTIONS, ...options };

		if(isObject(options.variables)) {
			this.varnames = ['escape', ...Object.keys(options.variables)].join(',');
			this.variables = Object.values(options.variables);

			delete options.variables;

			options.allowsCurrying = true;
		}

		this.options = options;
		this.tags = { ...tags };
		this.replace = () => '';

		this.build();
	} // }}}

	addTag(name: string, regex: RegExp, replace: TagHandler) { // {{{
		if(typeof name === 'string' && regex instanceof RegExp && typeof replace === 'function') {
			this.tags[name] = { regex, replace };

			this.build();
		}
	} // }}}

	clearTags() { // {{{
		this.tags = {};

		this.build();
	} // }}}

	compile(template: string, options?: TemplateOptions): CompiledTemplate { // {{{
		if(!template) {
			return NOOP;
		}

		options = { ...this.options, ...options };

		const header = substringBefore(template, '\n');
		let source: string;

		if(header.startsWith('{{}} ')) {
			source = template.slice(header.length + 1);

			const tokens = header.split(' ');

			for(const token of tokens) {
				if(token.startsWith('s')) {
					if(token === 'strip:true') {
						options.strip = true;
					}
					else if(token === 'strip:false') {
						options.strip = false;
					}
				}
				else if(token.startsWith('a')) {
					if(token === 'append:true') {
						options.append = true;
					}
					else if(token === 'append:false') {
						options.append = false;
					}
				}
				else if(token.startsWith('varnames:')) {
					options.varnames = substringAfter(token, ':');
				}
			}
		}
		else {
			source = template;
		}

		const startEnd = options.allowsCurrying ? (options.append ? START_END.curry.append : START_END.curry.split) : (options.append ? START_END.noncurry.append : START_END.noncurry.split);

		const context: TemplateContext = {
			cse: startEnd,
			unescape: options.unescape ?? unescapeCode,
			sid: 0,
		};

		source = source.replaceAll(COMMENT_REGEX, '').replaceAll(/'|\\/g, '\\$&');

		let script = this.replace(`var out='${source}`, this.tags, context) + '\';';

		if(options.strip) {
			script = script
				.replaceAll(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g, ' ')
				.replaceAll(/(\t|\s){2,}/g, '');
		}

		script = script
			.replaceAll('\n', '\\n')
			.replaceAll('\t', '\\t')
			.replaceAll('\r', '\\r')
			.replaceAll(/(\s|;|}|^|{)out\+='';/g, '$1')
			.replaceAll('+\'\'', '')
			.replaceAll(/(\s|;|}|^|{)out\+=''\+/g, '$1out+=');

		script += 'return out;';

		try {
			if(options.inlineVariables) {
				for(const [name, value] of Object.entries(options.inlineVariables)) {
					script = `var ${name}=${toSource(value)};${script}`;
				}
			}

			let result: Function;

			if(options.allowsCurrying) {
				if(options.varnames) {
					if(this.varnames) {
						result = curry(new Function(this.varnames + ',' + options.varnames, script), [options.escape ?? escapeHtml, ...this.variables]);
					}
					else if(context.useEscape) {
						result = curry(new Function('escape,' + options.varnames, script), [options.escape ?? escapeHtml]);
					}
					else {
						result = new Function(options.varnames, script);
					}
				}
				else {
					if(this.varnames) {
						result = curry(new Function(this.varnames, script), [options.escape ?? escapeHtml, ...this.variables]);
					}
					else if(context.useEscape) {
						result = curry(new Function('escape', script), [options.escape ?? escapeHtml]);
					}
					else {
						result = new Function('', script);
					}
				}
			}
			else {
				if(context.useEscape) {
					throw new Error('options.allowsCurrying is required to escape values');
				}
				else if(options.varnames) {
					result = new Function(options.varnames, script);
				}
				else {
					result = new Function('', script);
				}
			}

			return result as CompiledTemplate;
		}
		catch (error) {
			if(Boolean(console) && console.log) {
				console.log('Could not create a template function: ' + script);
				console.log(error instanceof Error ? error.stack ?? error.toString() : error);
			}

			throw error;
		}
	} // }}}

	removeTag(name: string) { // {{{
		if(name in this.tags) {
			delete this.tags[name];

			this.build();
		}
	} // }}}

	run(template: string, variables?: Record<string, unknown>, options?: TemplateOptions) { // {{{
		options = { ...options };

		if(variables) {
			options.varnames = Object.keys(variables).join(',');
		}

		const compiled = this.compile(template, options);

		if(variables) {
			return compiled(...Object.values(variables));
		}
		else {
			return compiled();
		}
	} // }}}

	private build(): void { // {{{
		let source = 'return source';

		const tagNames = Object.keys(this.tags).sort();

		for(const tagName of tagNames) {
			source += `.replace(tags.${tagName}.regex, (...args) => tags.${tagName}.replace.apply(context, args))`;
		}

		this.replace = new Function('source,tags,context', source + ';') as Replacer;
	} // }}}
}

/* eslint-enable no-new-func */
