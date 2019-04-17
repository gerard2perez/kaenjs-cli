import { targetPath } from '@gerard2p/mce/paths';
let configuration;
try {
	process.env.KAENCLI = 'true';
	require('ts-node/register');
	configuration = require(targetPath('node_modules/@kaenjs/core/configuration')).configuration;
} catch (ex) {
	console.log(ex);
	configuration = {};
}
export { configuration };
