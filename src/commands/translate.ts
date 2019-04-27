import { fail } from 'assert';
import axios from 'axios';
import chalk from 'chalk';
//@ts-ignore
import { deletedDiff, updatedDiff } from 'deep-object-diff';
import { readdirSync, writeFileSync } from 'fs';
import { ok, updateTextSpin } from '@gerard2p/mce/console';
import { bool, list, numeric, Parsed, text, verbose } from '@gerard2p/mce';
import { targetPath, cliPath } from '@gerard2p/mce/paths';
import { spin } from '@gerard2p/mce/spinner';
import { configuration } from '../utilities/configurations';
import { Languages } from '../utilities/languages';
const { server:{localization:{directory} } = {localization:{directory:''}} } = configuration;
export let description = 'A description for your command';
export let args = '[from]';
export let options = {
	sync: bool('-s', 'Update existing files'),
	force: bool('-f', 'Override file'),
	list: numeric('-l', 'Show list of available languages', 3),
	target: list('-t', 'comma separate langs'),
	filePath: text('-p', 'location for the file', directory),
	verbose: verbose('Increase system verbosity'),
};
export async function action(from: string, opt: Parsed<typeof options>) {
	if (!from && opt.list) {
		let twoLetterLang = Object.keys(Languages);
		let total = twoLetterLang.length;
		for (let i = 0; i < total; i += opt.list) {
			let languages = ((start: number, limit: number) => {
				let res = [];
				for (let i = start; i < start + limit; i++) {
					let key = twoLetterLang[i];
					if (key) {
						if (limit - 1 === i - start) {
							res.push(`[${chalk.blue(key)}] ${Languages[key]}`);
						} else {
							res.push(`[${chalk.blue(key)}] ${Languages[key].padEnd(30)}`);
						}

					}
				}
				return res;
			})(i, opt.list);
			console.log(languages.join(''));
		}
		return 0;
	}
	from = from || configuration.server.localization.default;
	if (!from) {
		console.log('No source locale, please check your configuration');
		return 1;
	}
	if (!opt.target.length && !opt.sync) {
		console.log('No target locale, please check your configuration');
		return 1;
	}
	let tos = opt.target.filter(t => t !== from);
	let translation = require(targetPath(opt.filePath, `${from}.json`));
	let keys = Object.keys(translation);
	let langugesconfig:any = {}; // { from: translation};
	let lang_name = {};
	let from_sync = {};
	if(opt.sync) {
		tos = readdirSync(targetPath(opt.filePath)).map(p=>p.replace('.json', ''));
		try {
			from_sync = require(targetPath(opt.filePath, `${tos.find(t=>t.includes('-sync'))}.json`));
		} catch(ex) {}

	}
	tos = tos.filter(t=> t!==from && !t.includes('-sync') );
	await spin('Translating', async () => {
		for (const to of [from, ...tos]) {
			langugesconfig[to] = {};
			try { langugesconfig[to] = require(targetPath(opt.filePath, `${to}.json`)); } catch(ex){}
			Object.assign(lang_name, langugesconfig[to].__lang__);
			if(!lang_name[to]) {
				lang_name[to] = to === 'en' ? Languages[to] : (await translate(Languages[to], {from:'en', to})).text;
			}
		}
		let main_key_updates = updatedDiff(from_sync, langugesconfig[from]);
		let total_keys = 0;
		for(let to of tos) {
			total_keys = deleteObjectKeys(langugesconfig[to], main_key_updates);
			total_keys +=  deleteObjectKeys(langugesconfig[to], deletedDiff(langugesconfig[to], langugesconfig[from])) ;
		}
		writeFileSync(targetPath(opt.filePath, `${from}-sync.json`), JSON.stringify(langugesconfig[from], null, 4));
		for (const to of tos) {
			let current = opt.force ? {} : langugesconfig[to];
			try {
				updateTextSpin(`Translating ${to}`);
				let translated = await translateObject(translation, from, to, current);
				// updateTextSpin(`Translating [${to}] -> ${key} (${per}%)`);
				translated.__lang__ = lang_name;
				writeFileSync(targetPath(opt.filePath, `${to}.json`), JSON.stringify(translated, null, 4));
				ok(targetPath(opt.filePath, `${to}.json`));
			} catch (ex) {
				console.log(ex);
				fail(to);
			}
		}
		translation.__lang__ = lang_name;
		writeFileSync(targetPath(opt.filePath, `${from}.json`), JSON.stringify(translation, null, 4));
		createHash(targetPath(opt.filePath, `${from}.json`));

	});
}
function deleteObjectKeys(object:any, object_key:any) {
	let total =0;
	if(!object)return total;
	for(const key of Object.keys(object_key)) {
		if(object_key[key] && typeof object_key[key] === 'object') {
			total += deleteObjectKeys(object[key], object_key[key]);
		} else {
			if(object[key]) {
				delete object[key];
				total++;
			}
		}
	}
	return total;
}
function createHash(source:string) {
	return new Promise(resolve=>{
		var fs = require('fs');
		var crypto = require('crypto');

		// the file you want to get the hash
		var fd = fs.createReadStream(source);
		var hash = crypto.createHash('sha1');
		hash.setEncoding('hex');

		fd.on('end', function() {
			hash.end();
			resolve(hash.read());
		});

		// read all file and pipe it (write it) to the hash object
		fd.pipe(hash);
	});
}
async function translateObject(entry:any, from:string, to:string, target:any= {}) {
	let translated:any = Object.assign({}, target);
	for(const key of Object.keys(entry) ) {
		if(typeof entry[key] === 'object') {
			if(key !== '__lang__')
			translated[key] = await translateObject(entry[key], from, to, target[key]);
		} else {
			let keyindex=0;
			let preservekeys = {};
			let value = (entry[key] as string).replace(/\{\{[^\}]*\}\}/g,(value)=>{
				let newkey = `<span class='notranslate'>${value}</span>`;
				preservekeys[newkey] = value;
				return newkey;
			});
			if(!target[key])
			translated[key] = (await translate(value, { from, to })).text
				.replace(/<[^>]*span[^<]*>/g, '')
				.replace(/ +/g, ' ');
		}
	}
	return translated;
}
async function translate(value:string, {from, to}:{from:string, to:string}): Promise<{text:string}> {
	// return {text: 'newTranslation'};
	return axios.post('https://translation.googleapis.com/language/translate/v2?key=AIzaSyAyfLSfkWmzlpxdgdtxcry6j0feZm8FoEw', {
		q:value,
		source: from,
		target: to,
		format: 'html'
	  })
	  .then(({data:{data}})=> {
		  return {text: data.translations[0].translatedText};
	  });
}
