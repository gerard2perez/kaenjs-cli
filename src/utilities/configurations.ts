import { targetPath } from '@gerard2p/mce/paths';
import { existsSync, readdirSync } from 'fs';
process.env.KAENCLI = 'true';
require('ts-node').register({
	transpileOnly:true,
});

class DevProdConfig {
	[key: string]: any;
	constructor(lib: object) {
		for (const key of Object.getOwnPropertyNames(lib)) {
			this[key] = this.DeepDevOrProd(lib, key);
		}
	}
	/**
	 * Creates an object based on its dev prod properties and merges them accordint to
	 * the current NODE_ENV
	 * This function is recursive and will transform the hole object
	 * @private
	 * @param {object} object target object to transform
	 * @param {string} prop the property to look at
	 * @example {a:{dev:0,prod:1}} if NODE_ENV = 'productoin' -> {a:1}
	 */
	DeepDevOrProd(object: object, prop: string) {
		let target = object[prop];
		if (target instanceof Array) {
			return target;
		} else if (typeof target === 'object' && Object.keys(target).indexOf('dev') === -1) {
			let newobj = {};
			for (const deep of Object.keys(target)) {
				newobj[deep] = this.DeepDevOrProd(object[prop], deep);
			}
			return newobj;
		}
		if (Object.keys(target).indexOf('dev') === -1) {
			return target;
		} else {
			return process.env.NODE_ENV === 'production'
				? /* istanbul ignore next */ target.prod
				: target.dev;
		}
	}
}
class Configuration {
	environment: string;
	bundles: object = {};
	conections: object = {};
	inflections = {
		plural: [],
		singular: []
	};
	// authentication:any = {};
	server: any = {localization:{directory:''}, name:''};
	static: object = {};
	views: object = {};
	constructor() {
		this.environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
		if(existsSync(targetPath('src', 'configuration')))
		for (const file of readdirSync(targetPath('src', 'configuration'))) {
			try {
				if (file.includes('authentication')) continue;
				if (/.*\.map$/.exec(file) === null) {
					let [lib] = file.split('.');
					let file_module = targetPath('src', 'configuration', file);
					// let input = readFileSync(file_module, 'utf-8');
					// let output = transpileModule(input,{ fileName: file_module }).outputText;
					// let compiled_file = file_module.replace('.ts', '.js');
					// writeFileSync(compiled_file, output);
					// let config = require(compiled_file).default;
					let config = require(file_module).default;
					this[lib] = new DevProdConfig(config);

				}
			} catch (ex) {
				console.log(ex);
			}
		}
	}
}
const configuration = new Configuration();
export { configuration };

