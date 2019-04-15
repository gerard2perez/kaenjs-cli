import { configuration } from './configurations';
import { readFileSync, writeFileSync } from 'fs';
import { ok } from '@bitsun/mce/console';
export function host_location() {
	const os = require('os');
	let hostsdlocation = '';
	switch (os.platform()) {
		case 'darwin':
			hostsdlocation = '/private/etc/hosts';
			break;
		case 'linux':
			hostsdlocation = '/etc/hosts';
			break;
		case 'win32':
			hostsdlocation = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
			break;
		default:
			console.error("your os is not detected, hosts files won't be updated");
			break;
	}
	return hostsdlocation;
}
export function updateHostsFile() {
	let {
		server: { subdomains = [], host }
	} = configuration;
	if (!subdomains.includes('www')) {
		subdomains.push('www');
	}

	const hostsdlocation = host_location();
	/* istanbul ignore else */
	if (hostsdlocation !== '') {
		let changed = false;
		let hostsd = readFileSync(hostsdlocation, 'utf-8');
		for (const subdomain in subdomains) {
			let entry = '127.0.0.1\t' + subdomains[subdomain] + '.' + host;
			if (hostsd.indexOf(entry) === -1) {
				hostsd += '\n' + entry;
				changed = true;
			}
		}
		if (changed) {
			writeFileSync(hostsdlocation, hostsd.replace(/\n+/gim, '\n'));
			ok('Updated hosts file.');
		}
		return changed;
	}
	return false;
}
