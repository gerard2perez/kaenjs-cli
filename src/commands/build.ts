import { Parsed, text } from '@gerard2p/mce';
import { error, ok } from '@gerard2p/mce/console';
import { cp, printRelativePath, targetPath } from '@gerard2p/mce/utils';
import * as fb from 'fast-glob';
import { existsSync, mkdirSync, readFile, writeFile } from 'fs';
import { dirname, posix } from 'path';
import { minify } from 'uglify-es';
import { promisify } from 'util';
export let description = 'Build your project for production';
// export let args = '<arg1> [varidac...]';
export let options = {
	config: text('-c <config>', 'Configuratión source file', 'tsconfig.dist.json'),
	output: text('-o <output>', 'Configuratión source file', 'dist'),

};
export async function action(opt:Parsed<typeof options>) {
	let { compilerOptions:{outDir} } = require(targetPath(opt.config));
	let res = await fb<string>(`${outDir}/**/*.js`);
	for(const asset of await fb<string>(posix.join('public', '**', '*.*'))) {
		let target = posix.join(opt.output,asset);
		ensureDir(dirname(target));
		cp(asset, posix.join(opt.output,asset));
	}
	for(const asset of await fb<string>(posix.join('views', '**', '*.*'))) {
		let target = posix.join(opt.output,asset);
		ensureDir(dirname(target));
		cp(asset, posix.join(opt.output,asset));
	}
	cp('package.dist.json', posix.join(opt.output, 'package.json'));
}
async function compress(source:string, output:string) {
	let source_text = await promisify(readFile)(source, 'utf-8');
	let minified = minify(source_text, {
		ecma:8,
		output: {
			ecma:8,
			beautify: false
		}
	});
	if(minified.error) {
		error(minified.error);
	} else {
		await promisify(writeFile)(output, minified.code);
		let per = Math.round((1-(minified.code.length/source_text.length))*10000)/100;
		ok(`[${per}%] ${printRelativePath(output)}\t${source_text.length}B -> ${minified.code.length}B`);
	}
}
function ensureDir(dir) {
	if(!existsSync(dir)) {
		mkdirSync(dir, {recursive:true});
	}
}
