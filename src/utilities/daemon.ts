import { watch } from 'chokidar';
import { cliPath } from '@bitsun/mce/paths';
import { rawSpawn } from '@bitsun/mce/spawn';
import { livereload } from './livereload';

export function StartServer(args, opt) {
	let argv = ['--respawn', '--all-deps', '--transpileOnly', '--prefer-ts', ...args];
	// console.log(args.join(' '));
	// console.log(argv.join(' '));
	let program = cliPath('node_modules/.bin/ts-node-dev');
	// program = `node -r ${cliPath('node_modules/ts-node/register')}`;
	// program = cliPath('node_modules/.bin/ts-node');
	// console.log(program);
	let server = rawSpawn(program, argv, {
		env: {
			KAENCLI: 'true',
			DEBUG: opt.debug,
			NODE_ENV: opt.env,
			liveReloadHost: livereload.host
		},
		stdio: 'inherit'
	});
	let watcher = watch(['**/*.js', 'views/layouts/**/*.*'], {
		awaitWriteFinish: {
			stabilityThreshold: 700,
			pollInterval: 100
		},
		ignoreInitial: true,
		ignored: [
			'**/*.d.ts',
			'**/*.js.map',
			'.git',
			'node_modules',
			'src',
			'.vscode',
			'assets',
			'cached',
			'public',
			'locales',
			'*.tmp',
			'*.json',
			'*.conf'
		]
	}).on('all', (event, path) => {
		watcher.close();
		server.kill();
		server = StartServer(args, opt);
		console.log('==========');
		console.log('==========');
	});
	server.on('exit', (code: number, signal: string) => {
		let shouldExit = (code === 1 && signal === null) || (code === null && signal === 'SIGTERM');
		if (shouldExit) process.kill(0);
	});
	process.on('SIGINT', code => {
		process.exit(0);
	});
	return server;
}
