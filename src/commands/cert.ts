import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { bool, list, numeric, Parsed, text } from '@bitsun/mce';
import { ok } from '@bitsun/mce/console';
import { cliPath, targetPath } from '@bitsun/mce/paths';
import { render } from '@bitsun/mce/render';
import { spinSpawn } from '@bitsun/mce/spawn';
import { configuration } from '../utilities/configurations';
import { restartNginx } from '../utilities/nginx';
export let description = 'Generates a local certificate to use https in your local machine';

let {server:{host=''} = {} } = configuration;
export let options = {
	cert: text('-c', 'Certificate Name'),
    co: text('<c>', '2 word codes to describe the country', /[aA-zZ]{2}/, 'MX'),
    st: text('<st>', '2 word codes to describe the estate', /[aA-zZ]{2}/, 'GN'),
    lo: text('<l>', '3 word code to describe the locality', /[aA-zZ]{3}/, 'IRA'),
    or: text('<o>', 'Organization Name', 'Kaen'),
    ou: text('<ou>', 'Organization Unit', 'DVL'),
    cn: text('<cn>', 'Common Name', `www.${host}`),
    email: text('<email>', 'Email to use in cert', /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'gerard2perez@outlook.com'),
    days: numeric('', 'Total Days to Expire', 365),
    genCa: bool('', 'Generate Certificate Authority'),
    altNames: list('', 'comma separated domains'),
    // verbose: verbose()
}
export async function action(opt:Parsed<typeof options>) {
    let {co,st,lo,or,ou,cn,email,days,genCa,altNames,cert} = opt;
	let altNamesDNS:string[] = altNames.map(d=>`DNS:${d}`);
    altNamesDNS.push(`email:${email}`);

    let rootWebsite = cn;
    let config = { rootWebsite, altNamesDNS:altNamesDNS.join(','), c:co, st, l:lo, o:or, ou, email };
    let CAKey = `${cliPath('kaenCA.key')}`;
    let CAPEM = `${cliPath('kaenCA.pem')}`;
    if (genCa) {
        CAKey = 'rootCA.key';
        CAPEM = 'rootCA.pem';
    }
	let certName = cert || host;
    render(cliPath('templates/openssl.cnf'),config, targetPath('openssl.cnf'));
    render(cliPath('templates/v3_ca.cnf'), config, targetPath('v3_ca.cnf'));
    let keyName = `${certName}.key`;
    let certificateName = `${certName}.crt`;
    let rootKey = ['genrsa', '-des3', '-passout', 'pass:kaen_key', '-out', CAKey, 2048];
    let rootPEM = ['req', '-x509', '-new', '-nodes', '-key', CAKey, '-passin', 'pass:kaen_key', '-sha256', '-days', '36500', '-config', `${cliPath('templates/opensslRootCA.cnf')}`, '-out', `${CAPEM}`];
    let srvKey = ['req', '-new', '-sha256', '-nodes', '-out', `${certName}.csr`, '-newkey', 'rsa:2048', '-keyout', keyName, '-config', 'openssl.cnf'];
    let srvCert = ['x509', '-req', '-in', `${certName}.csr`, '-CA', `${CAPEM}`, '-CAkey', `${CAKey}`, '-CAcreateserial', '-passin', 'pass:kaen_key', '-out', certificateName, '-days', days, '-sha256', '-extfile', 'v3_ca.cnf'];
    if (genCa && !existsSync(targetPath('rootCA.pem'))) {
        await spinSpawn('Generating RootCA Key', 'openssl', rootKey).then(()=>ok('RootCA Key'));
        await spinSpawn('Generating RootCA PEM', 'openssl', rootPEM).then(()=>ok('RootCA Pem'));
    }
    await spinSpawn('Generating Key', 'openssl', srvKey).then(()=>ok('Server Key'));
    await spinSpawn('Generating Certificate', 'openssl', srvCert).then(()=>ok('Server Certificate'));
    if (existsSync('src/configuration/server.ts')) {
        let file = readFileSync('src/configuration/server.ts', 'utf-8')/*.replace(/\n|\t/gm, ' ')*/.replace(/:/gm, ': ').replace(/ +/gm, ' ');
        file = updateKey(file, 'key',keyName);
        updateKey(file, 'cert',certificateName);
        ok('Updated: src/configuration/server.ts');
        await restartNginx();

    }
    unlinkSync(targetPath('openssl.cnf'));
    unlinkSync(targetPath('v3_ca.cnf'));
    unlinkSync(targetPath(`${certName}.csr`));
}
function updateKey(file:string, key:string, value:string) {
    let https_exoresion = /^\thttps: {((.|\n)*)\t},$/m;
	let httpsContent = https_exoresion.exec(file)[1];
    let expression = new RegExp(`${key}:([^}]*[\n\t}]?)`, 'im'); //im;
    let replaceval = '';
    let target = targetPath(value).replace(/\\/gm, '\\\\');
    let res = expression.exec(httpsContent);
    if ( res ) {
        let value = res[1];
        if(value.includes('{')) {
            replaceval =  value.replace(/dev:([^,]*)/, `dev: '${target}'`);
        } else {
            let rawvalue = / (.*)/.exec(value)[1];
            replaceval = `{\n\t\t\tdev: '${target}',\n\t\t\tprod: ${rawvalue}\n\t\t}`
        }
        replaceval = `${key}: ${replaceval}`;
        httpsContent = httpsContent.replace(expression, replaceval);
    } else {
        replaceval = `{\n\t\t\tdev: '${target}',\n\t\t\tprod: ''\n\t\t},`;
        httpsContent = `\n\t\t${key}: ${replaceval}` + httpsContent;
    }
    let content = file.replace(https_exoresion, `\thttps: {${httpsContent}\n\t},`).replace(/\n+/gm,'\n');
    writeFileSync('src/configuration/server.ts', content);
    return content;
}
