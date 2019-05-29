import { MCE } from '@gerard2p/mce';
MCE(__dirname)
	.submodules('kaen.json')
	.subcommand(process.argv);
