import { writeFileSync } from 'fs';
import { bool, Parsed, text } from '@gerard2p/mce';
import { targetPath } from '@gerard2p/mce/paths';
import { buildConfiguration, persisConfiguration, restartNginx } from '../utilities/nginx';
export let description = 'helps bind the server to nginx';
export let options = {
    install: bool('-i', 'creates and install the .conf in your nginx path.'),
    certbot: text('-c', 'webroot path for certbot')
};
export async function action(opt:Parsed<typeof options>) {
    let conf = await buildConfiguration(opt.certbot);
    writeFileSync(targetPath('nginx.conf'), conf);
    if (opt.install) {
        await persisConfiguration(conf);
        await restartNginx();
    }

}
