import { configuration } from './configurations';
import { join } from 'path';
import { spawn } from '@gerard2p/mce/spawn';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { cliPath } from '@gerard2p/mce/paths';
import { render } from '@gerard2p/mce/render';
import { ok, error } from '@gerard2p/mce/console';

let nginxpath: string;
export async function getnginxpath() {
	if (nginxpath === undefined) {
		/* istanbul ignore next */
		if (process.env.TRAVIS) {
			return join(process.cwd(), '..', 'etc', '/');
		}
		let log = await spawn('nginx', ['-t'], {}, false);
		if (!log) {
			throw new Error('Err! are you sure nginx is running and well configured.');
		}
		nginxpath = log.toString().match(/.* file (.*)nginx\.conf test/)[1];
	}
	return nginxpath;
}

export async function buildConfiguration(webroot: string = '') {
	let {
		server: {
			subdomains = [],
			host,
			https: { cert = '', key = '', dhparam = '', http2 = false } = {},
			client_max_body_size = '1M',
			port = 62626
		}
	} = configuration;
	let [https_redirect, https, http] = readFileSync(cliPath('templates/nginx.conf.kaen'), 'utf-8')
		.replace(new RegExp('{{host}}', 'gm'), host)
		.replace(new RegExp('{{port}}', 'gm'), port)
		.replace(new RegExp('{{http2}}', 'gm'), http2 ? 'http2;' : ';')
		.replace(new RegExp('{{client_max_body_size}}', 'gm'), client_max_body_size)
		.split('/--split--/');
	subdomains = subdomains.filter(s => s !== 'www').map(s => `${s}.${host}`);

	if (cert && key) {
		https_redirect = https_redirect.replace('{{subdomains}}', subdomains.join(' '));
		if (webroot) {
			webroot = `\n    location /.well-known/ {\n        default_type "text/plain";\n        allow all;\n        root ${webroot};\n    }`;
		}
		https_redirect = https_redirect.replace('{{webroot}}', webroot);
		https = https.replace('{{subdomains}}', subdomains.join(' '));
		if (dhparam) dhparam = `ssl_dhparam ${dhparam};`;
		https = https
			.replace('{{ssl_certificate}}', `ssl_certificate ${cert}`)
			.replace('{{ssl_dhparam}}', dhparam)
			.replace('{{ssl_certificate_key}}', `ssl_certificate_key ${key}`);
		return https_redirect + https;
		// let target_path = join(await getnginxpath(),'sites-enabled', `${host}.conf`);

		// writeFileSync( target_path, http);
		// ok('Update non SSL configuration');
	} else {
		return http;
	}
	// location /.well-known/ {
	//     default_type "text/plain";
	//     allow all;
	//     root /root/saai/public;
	// }
}

export async function persisConfiguration(data: string) {
	let {
		server: { host }
	} = configuration;
	let target_path = join(await getnginxpath(), 'sites-enabled', `${host}.conf`);
	writeFileSync(target_path, data);
	ok('Update Nginx configuration');
}
export async function restartNginx() {
	let {
		server: { https: { cert = '', key = '' } = {} }
	} = configuration;
	if (cert && key) {
		if (await spawn('nginx', ['-t'], {}, true)) {
			if (await spawn('nginx', ['-s', 'reload'], {}, true)) {
				ok('nginx restarted');
			} else {
				error('could not restart nginx');
			}
		} else {
			error('nginx configuration is wrong');
		}
	}
}
