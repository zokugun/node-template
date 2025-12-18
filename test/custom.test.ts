import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expect, it } from 'vitest';
import { Template } from '../src/index.js';
import { toSource } from '../src/utils/to-source.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

it('should do new', () => {
	const custom = new Template({
		interpolate: {
			regex: /\${([\s\S]+?)}/g,
			replace(m, code) {
				return this.cse.start + 'it.' + code + '()' + this.cse.end;
			},
		},
	});

	expect(custom).to.exist;
	expect(custom).to.have.property('compile');
});

it('should compile', () => {
	const custom = new Template({
		interpolate: {
			regex: /\${([\s\S]+?)}/g,
			replace(m, code) {
				return this.cse.start + 'it.' + code + '()' + this.cse.end;
			},
		},
	});

	expect(toSource(custom.compile(fs.readFileSync(path.join(__dirname, 'custom.src'), 'utf8')))).to.equal(fs.readFileSync(path.join(__dirname, 'custom.gen'), 'utf8').trimEnd());
});
