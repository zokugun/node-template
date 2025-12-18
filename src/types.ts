export type CompiledTemplate = (...args: unknown[]) => string;

export type EscapeFunction = (value: unknown) => string;

export type Replacer = (source: string, tags: TemplateTags, context: TemplateContext) => string;

export type StartEnd = {
	start: string;
	end: string;
	startencode: string;
	endencode: string;
};

export type StartEndSet = {
	append: StartEnd;
	split: StartEnd;
};

export type StartEndConfig = {
	curry: StartEndSet;
	noncurry: StartEndSet;
};

export type TagHandler = (this: TemplateContext, match: string, ...args: string[]) => string;

export type TemplateContext = {
	cse: StartEnd;
	unescape: (code: string) => string;
	sid: number;
	useEscape?: boolean;
};

export type TemplateOptions = {
	varnames?: string;
	strip?: boolean;
	append?: boolean;
	allowsCurrying?: boolean;
	inlineVariables?: Record<string, unknown>;
	escape?: EscapeFunction;
	unescape?: (code: string) => string;
};

export type TemplateInitOptions = TemplateOptions & { variables?: Record<string, unknown> };

export type TemplateTag = {
	regex: RegExp;
	replace: TagHandler;
};

export type TemplateTags = Record<string, TemplateTag>;
