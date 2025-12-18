import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import { expect, it } from 'vitest';
import { template } from '../src/index.js';
import { toSource } from '../src/utils/to-source.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function prepare(file: string) {
	const name = path.basename(file).replace(/\.src$/, '');

	it(`should compile ${name}`, () => {
		const source = fs.readFileSync(file, 'utf8');
		const generated = fs.readFileSync(file.replace(/\.src$/, '.gen'), 'utf8');

		expect(toSource(template.compile(source))).to.equal(generated.trimEnd());
	});
}

const files = globSync('**/**.src', {
	cwd: path.join(__dirname, 'cases'),
	absolute: true,
});

for(const file of files) {
	prepare(file);
}
