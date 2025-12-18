export type CurriedFunction = Function & { __original?: Function };

export function curry(fn: Function, args: unknown[], bind?: Object): CurriedFunction {
	args = Array.from(args);

	const result = (...newArgs: unknown[]): unknown => fn.apply(bind, [...args, ...newArgs]);

	result.__original = fn;

	return result;
}
