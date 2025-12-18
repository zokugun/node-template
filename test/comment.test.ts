import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expect, it } from 'vitest';
import { template } from '../src/index.js';
import { toSource } from '../src/utils/to-source.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function compile(name: string) {
	expect(toSource(template.compile(fs.readFileSync(path.join(__dirname, `${name}.src`), 'utf8'), {
		strip: false,
	}))).to.equal(fs.readFileSync(path.join(__dirname, `${name}.gen`), 'utf8').trimEnd());
}

it('should compile folding', () => {
	compile('comment.folding');
});
