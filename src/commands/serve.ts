import { bool, enumeration, numeric, Parsed, text } from '@gerard2p/mce';
import { StartServer } from '../utilities/daemon';
import axios from 'axios';
import { configuration } from '../utilities/configurations';
import { ok, info } from '@gerard2p/mce/console';
import { targetPath } from '@gerard2p/mce/paths';
import { existsSync, readdirSync, statSync } from 'fs';
import { MainSpinner } from '@gerard2p/mce/spinner';
export let description = 'Start the server in watch mode.\n      To lauch in production use "node server\n      [proram=server]"';
export let args = '[program]';
export let options = {
    inspectBrk: numeric('<port>', 'port for inspector'),
    env: enumeration('<env>', 'Run in which configuration', ['development', 'production'], 'development'),
    nginx: bool('-n', 'Generates and Instal nginx configuration'),
    assets: bool('-a', 'Watch for changes in assets and templates'),
    debug: text('<opt>', 'argument to pass to DEBUG env var', 'kaen')
};
const redbird = axios.create({baseURL: 'http://localhost:6060'});
function loadRoutes() {
	if (existsSync(targetPath('src/routes')) && statSync(targetPath('src/routes')).isDirectory()) {
		for (const file of readdirSync(targetPath('src/routes'))) {
			if (/\.map$/.exec(file) === null) {
				let subdomain = file.replace(/\..*$/g, '');
				process.env.KAEN_INTERNAL_SUBDOMAIN = subdomain;
				require(targetPath('src/routes', file));
			}
		}
	} else {
		require(targetPath('./src/routes'));
	}
	require(targetPath('./node_modules/@kaenjs/router')).Routes();
}
async function registerHosts() {
	const {Router} = require(targetPath('node_modules/@kaenjs/router'));
	const {host} = configuration.server;
	let targets = Router.subdomains.map(s=>`${s}.${host}`);
	let hosts = (await redbird.get('hosts/')).data;
	let hosts_file_ok=true;
	for(const target of targets) {
		if(!hosts[target]) {
			let res = await redbird.post('hosts/',{
				source: '127.0.0.1',
				target
			});
			hosts_file_ok = res.status === 201;
			if(res.status === 201) {
				ok(`domain ${target} registered on @gerard2p/redbird`);
			}
		}
	}
	if(hosts_file_ok)MainSpinner.info(`Hosts file is ok`);
}
async function kn_redbird() {
	let {status, data} = await redbird.get('/');
	if(status === 200) {
		MainSpinner.info(`using kaen-redbird: ${data.version}`);
		MainSpinner.info(`using redbird: ${data.redbird}`);
		return true;
	}
	return false;
}
async function registerProxy({key, cert}) {

	const {Router} = require(targetPath('node_modules/@kaenjs/router'));
	let proxies = await (await redbird.get('proxy/')).data;
	let {port} = configuration.server;
	let source = `127.0.0.1:${port}`;
	let por
	const {host} = configuration.server;
	let targets = Router.subdomains.map(s=>`${s}.${host}`);
	let options = undefined;
	if(key && cert) {
		source = `https://${source}`;
		options = {ssl:{key, cert}};
	} else {
		source = `http://${source}`;
	}
	let body:any = {
		source,
		target: targets
	};
	if(options)body.options = options;
	let proxy_exists = !!proxies[source];
	if(proxy_exists) {
		let proxy_count = proxies[source].host.filter(h=>targets.includes(h)).length;
		if(proxy_count === 0) {
			let ports = Object.keys(proxies).map(k=>parseInt(k.split(':')[2])).sort().filter(p=>p>port);
			let tryport:number = port;
			while(ports.includes(++tryport));
			MainSpinner.warn(`Cannot serve app on port $port}, other app is registerd: ${proxies[source].host.join(',')}`)
			MainSpinner.warn(`Try with port: ${tryport}`);
			return false;
		} else {
			let {status} = await redbird.put('proxy/', body);
			proxy_exists = status === 200;
			if(proxy_exists) {
				MainSpinner.info('Reverse Proxy updated');
			} else {
				MainSpinner.warn('Reverse Proxy not updated');
				return false;
			}
		}
	} else {
		let {status} = await (redbird.post('proxy/', body));
		if(status === 201) {
			ok('Reverse Proxy Created on @gerard2p/redbird');
		} else {
			MainSpinner.error('Reverse proxy not created');
			return false;
		}
	}
	return true;
}
export async function action(program: string, opt: Parsed<typeof options>) {
    let args = [];
	if (opt.inspectBrk) args.push(`--inspect-brk=${opt.inspectBrk}`);
	let file = program || 'server.ts';
	args.push(`src/${file}`);
	try{
		loadRoutes();
		if ( await kn_redbird() ) {
			await registerHosts();
			if(!await registerProxy(configuration.server.https || {}) )
			return false;
		}

	}catch(ex) {
		// console.log(ex);
	}
    StartServer(args, opt);
}
