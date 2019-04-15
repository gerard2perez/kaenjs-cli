import * as livereload_server from 'livereload';
import { configuration } from './configurations';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { cliPath } from '@bitsun/mce/paths';
// function initialize
class Livereload {
	private _server: { refresh(filepath: string): void; alert(data: any): void };
	private options = {
		https: {},
		port: 35729
	};
	private get server() {
		if (!this._server) {
			let content = readFileSync(
				cliPath('node_modules/livereload/ext/livereload.js'),
				'utf-8'
			);
			if (!content.includes('KaenCLI patch')) {
				let patch = readFileSync(cliPath('templates/public/livereload.js'), 'utf-8');
				let newcontent = content.replace(
					/LiveReload.prototype.performAlert = function\(message\) {\W+return alert\(message.message\);\W+;/,
					patch
				);
				writeFileSync(cliPath('node_modules/livereload/ext/livereload.js'), newcontent);
			}
			if (
				configuration.server.https &&
				configuration.server.https.key &&
				configuration.server.https.cert
			) {
				this.options.https = {
					cert: readFileSync(configuration.server.https.cert),
					key: readFileSync(configuration.server.https.key)
				};
			}
			this._server = livereload_server.createServer(this.options);
		}
		return this._server;
	}
	build(bundle: string) {
		this.server.alert({ kaen: 'show', data: ` building ${bundle}...` });
	}
	refresh(file: string) {
		this.server.refresh(file);
		this.server.alert({ kaen: 'hide' });
	}
	get host() {
		this.server;
		return `//www.${configuration.server.host}:${this.options.port}/livereload.js?snipver=1`;
	}
}
export const livereload = new Livereload();
