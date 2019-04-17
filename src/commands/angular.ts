import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { Parsed } from '@gerard2p/mce';
import { targetPath } from '@gerard2p/mce/paths';
import { inflector } from '../utilities/inflector';
export let description = 'mode=[page|component]';
export let args = '<mode> [pages...]';
export let options = {
//     enumeration: enumeration('-e <enum>', 'Define the style of command you will use', ['git', 'single'],'single'),
//     number: numeric('-n <n>', 'A number'),
//     floating: floating('-f <n>', 'A float number'),
//     range: range('-r <a>..<b>', 'A Range of two numbers'),
//     text: text('-t <n>', 'A string value'),
//     list: list('-l <n>', 'comma separed values'),
//     collect: collect('-c <n>', 'A repetable value'),
//     bool: bool('-b', 'A boolean value'),
//     verbose: verbose('Increase system verbosity'),
};
let ts = (cname:string, name:string, sufix:string, type:string)=> `import { Component } from '@angular/core';
@Component({
  selector: '${name}${sufix}',
  templateUrl: './${name}.html',
  styleUrls: ['./${name}.scss']
})
export class ${cname}${type} {

  constructor() { }

}
`;
let scss = (name:string, sufix:string) => `${name}${sufix} {

}
`;
let html = (name:string,sufix:string) => `<p>${name}${sufix} works!</p>`;
function inserImport(text:string, import_st:string) {
	let import_regex = new RegExp(import_st, 'g');
	let last_import_regex = /(import.*;)/mg
	if ( import_regex.exec(text) === null) {
		let last_import = (text.match(last_import_regex)||[]).pop()
		let find = new RegExp(`(${last_import})[\r\n]+`);
		return text.replace(find, `$1\n${import_st}\n\n`);
	}
	return text;
}
function insertDeclaration(text:string, declaration:string) {
	let declaration_regex = new RegExp(`.*declarations[^\\]]*\\[[^\\]]*\\]`, 'gm');
	let [dec=null] = declaration_regex.exec(text) || [];
	if(dec !== null) {
		let line = dec.includes('\r\n') ? '\r\n' : ( dec.includes('\n') ? '\n' : '\r' );
		if ( !dec.includes(declaration) ) {
			let ident = '';
			let last = dec.split(line).map(e=>{
				if(!e.includes(',') && !e.includes('[') && !e.includes(']')) {
					ident = /[\t ]+/.exec(e)[0];
					e+=',';
				}
				return e;
			});
			last.splice(last.length-1,0,ident+declaration);
			return text.replace(declaration_regex,last.join(line));
		}
	}
	return text;
}
enum sufix {
	page = '-page',
	component = ''
}
enum modes {
	page = 'pages',
	component = 'components'
}
export async function action(mode:string, pages:string[], opt:Parsed<typeof options>) {
	if(!modes[mode])throw `invalid mode '${mode}'`;
	for(const name of pages) {
		let cname = inflector.transform(name, ['underscore','dasherize']).split('-').map(s=> inflector.capitalize(s)).join('')
		let lname = cname.toLowerCase();
		let selector = inflector.transform(name, ['underscore','dasherize']);
		let type = inflector.capitalize(mode);
		let path = `src/app/${modes[mode]}/${lname}/`;
		let import_header = `import { ${cname}${type} } from './${modes[mode]}/${lname}/${selector}';`
		try{  mkdirSync(targetPath(`src/app/${modes[mode]}/`)); }catch(e){}
		try{  mkdirSync(targetPath(path)); }catch(e){}
		writeFileSync(targetPath(path, `${selector}.ts`), ts(cname, selector, sufix[mode], type));
		writeFileSync(targetPath(path, `${selector}.scss`), scss(selector, sufix[mode]));
		writeFileSync(targetPath(path, `${selector}.html`), html(selector, sufix[mode]));
		let module = readFileSync(targetPath('src/app/app.module.ts'), 'utf-8');
		let text = insertDeclaration(inserImport(module, import_header), `${cname}${type}`);
		writeFileSync(targetPath('src/app/app.module.ts'), text);
	}
}
