import { targetPath } from '@gerard2p/mce/utils';
import { existsSync, writeFileSync } from 'fs';
export function register(name:string, location:string) {
	let target = targetPath('kaen.json');
	if ( !existsSync(target)) {
		writeFileSync(target, JSON.stringify({commands:{}},null, 2));
	}
	let configuration = require(target);
	configuration.commands[name] = location;
	writeFileSync(target, JSON.stringify(configuration,null, 2));
}

export {register as default};
