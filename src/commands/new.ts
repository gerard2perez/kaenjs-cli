import chalk from "chalk";
import { copyFileSync, mkdirSync } from "fs";
import { error, ok } from '@gerard2p/mce/console';
import { bool, enumeration, Parsed } from '@gerard2p/mce';
import { render } from '@gerard2p/mce/render';
import { spawn } from '@gerard2p/mce/spawn';
import { spin } from '@gerard2p/mce/spinner';
import { join } from "path";
import { secret } from '../utilities/secret';

const templateDir = join(__dirname, '../templates');
let RelPathRoot;
export let options = {
    engine: enumeration('-e <engine>', 'Select a Render Engine', ['nunjucks', 'handlebars'], 'nunjucks'),
    npm: bool('-n', 'Installs npm dependecies'),
    force: bool('-f', 'Overrides target directory')
}
function fFile(target:string) {
    let path = target.split(/\\|\//gm);
	path.splice(0,0,RelPathRoot);
	let last:string = path.pop();
	ok(join(...path, chalk.green(last)).replace(/\\/mg, '/'));
}
function project (...path:string[]) {
	return join(RelPathRoot, ...path);
}
function templates(...path:string[]) {
    return join(templateDir, ...path);
}
function mkdir (dir:string='') {
    try{
    mkdirSync(project(dir));
    }catch(e){}
    fFile(dir);
}
function copy (source:string, target:string=source) {
	source = source.replace(/^src\//, '');
	copyFileSync(join(templateDir, source), project(target));
	fFile(target);
}
function compile(source:string, data:{[p:string]:string}, target:string=source) {
	source = source.replace(/^src\//, '');
    render(templates(source), data, project(target));
    fFile(target);
}
export let description = 'Creates a new Kaen Project';
export let args = '<application>';
export async function action(application:string, opt:Parsed<typeof options>) {
	RelPathRoot = application = application.toLocaleLowerCase().replace(/ /g, '-');
	// if ( !await override('Directory already exist. Do you want to override it', RelPathRoot, options.force)) return;
	await spin('Creating Files', async() => {
		mkdir();
		mkdir('.vscode');
		copy('.vscode/launch.json');
		copy('.vscode/settings.json');
		copy('.vscode/tasks.json');
		copy('.editorconfig');
		copy('.gitignore.tmp', '.gitignore');
		copy('tsconfig.json');
		copy('tsconfig.dist.json');
		if(process.env.KAEN_DEV==='true') {
			compile('package.dev.json', {application}, 'package.json');
		} else {
			compile('package.prod.json', {application}, 'package.json');
		}
		// Source Files
		mkdir('src');
		copy('src/server.ts');
		copy('src/routes.ts');
		mkdir('src/controllers');
		mkdir('src/configuration');
		compile('src/configuration/server.ts', {
			application
		});
		compile('src/configuration/authentication.ts', {
			key1:await secret(40),
			key2:await secret(40),
			key3:await secret(40),
			key4:await secret(40),
			key5:await secret(40),
			key6:await secret(40),
			key7:await secret(40),
			key8:await secret(40)
		});
		copy('src/configuration/bundles.ts');
		mkdir('src/locales');
		mkdir('src/seeds');
		mkdir('src/models');
		mkdir('public');
		mkdir('public/img');
		mkdir('public/css');
		mkdir('public/js');
		mkdir('assets');
		mkdir('assets/img');
		mkdir('assets/css');
		mkdir('assets/js');
		mkdir('views');
		copy('views/index.html');
		mkdir('views/layouts');
	});
	if (opt.npm) {
		await spin('Initializing npm', async() => {
			if ( !await spawn('npm', ['install', '-S'], {cwd: project()}) ) {
				error('npm installation failed');
			}
		});
	}
	await spin('Initializing git', async()=>{
		if ( !await spawn('git', ['init'], {cwd: project()})) {
			error('git init')
		}
		if ( await spawn('git', ['add', '.'], {cwd: project()}) )
		if ( !await spawn('git', ['commit', '-m', '"Initial Commit"'], {cwd: project(), shell: true}, false).catch((errr)=>{
			console.log(errr);
			return false;
		}) ) {
			error('git commit')
		}
	});
}
