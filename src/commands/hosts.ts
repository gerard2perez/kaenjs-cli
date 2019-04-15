import { readFileSync, writeFileSync } from 'fs';
import { ok } from '@bitsun/mce/console';
import { bool, Parsed } from '@bitsun/mce';
import { host_location } from '../utilities/hosts';
export let description = 'A description for your command';
export let args = '[host...]';
export let options = {
    remove: bool('-r ', 'Removes the specified host'),
};
export async function action(host:string[], opt:Parsed<typeof options>) {
	let hosts = readFileSync(host_location(), 'utf-8')
		.replace(/\r|\n/g, '\n')
		.replace(/\n+/g, '\n')
		.split('\n');
	hosts = hosts.filter( (e,i) => i === hosts.indexOf(e) );
	hosts = hosts.concat(host.map(h=>`127.0.0.1\t${h}`));
	writeFileSync(host_location(), hosts.join('\n'))
	ok(`Updated: ${host_location()}`);
}
