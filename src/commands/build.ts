import { Parsed, text, enumeration } from '@gerard2p/mce';
import { error, ok } from '@gerard2p/mce/console';
import { cp, printRelativePath, targetPath, spinSpawn } from '@gerard2p/mce/utils';
import * as fb from 'fast-glob';
import { existsSync, mkdirSync, readFile, writeFile, unlinkSync, statSync, readdirSync } from 'fs';
import { dirname, posix } from 'path';
import { minify } from 'uglify-es';
import { promisify } from 'util';
export let description = 'Build your project for production';
// export let args = '<arg1> [varidac...]';
export let options = {
	env: enumeration('-e <env>', 'environment', ['development', 'production'], 'production'),
	config: text('-c <config>', 'Configuratión source file', 'tsconfig.dist.json'),
	output: text('-o <output>', 'Configuratión source file', 'dist'),

};
export async function action(opt:Parsed<typeof options>) {
	await spinSpawn('Compiling', 'npx', ['tsc', '-b', opt.config]);
	await spinSpawn('Resources', 'kn', ['resources', '-e', opt.env]);
	let { compilerOptions:{outDir} } = require(targetPath(opt.config));
	for(const asset of await fb<string>(posix.join(opt.output, 'public', '**', '*.*'))) {
		unlinkSync(asset);
	}
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
	for(const script of (await fb<string>(`${outDir}/**/*.js`)).reverse()) {
		let target = posix.join(opt.output,script.replace(outDir, ''));
		ensureDir(dirname(target));
		await compress(script, target);
		// unlinkSync(script);
		// if(readdirSync(dirname(script)).length === 0)
		// 	unlinkSync(dirname(script));
	}
	// unlinkSync(outDir);
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
