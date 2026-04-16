import { defineConfig } from 'vitest/config';

export default defineConfig({
	oxc: {
		target: 'es2022'
	},
	test: {
		environment: 'node',
		reporters: 'dot',
		typecheck: {
			enabled: true,
		},
		include: ['./test/**/*.test.ts'],
		coverage: {
			reporter: ['html'],
			reportsDirectory: './coverage'
		}
	},
});
