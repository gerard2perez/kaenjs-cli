import { bool, collect, enumeration, floating, list, numeric, Parsed, range, text, verbose } from '@gerard2p/mce';
export let description = 'A description for your command';
export let args = '<arg1> [varidac...]';
export let options = {
    enumeration: enumeration('-e <enum>', 'Define the style of command you will use', ['git', 'single'],'single'),
    number: numeric('-n <n>', 'A number'),
    floating: floating('-f <n>', 'A float number'),
    range: range('-r <a>..<b>', 'A Range of two numbers'),
    text: text('-t <n>', 'A string value'),
    list: list('-l <n>', 'comma separed values'),
    collect: collect('-c <n>', 'A repetable value'),
    bool: bool('-b', 'A boolean value'),
    verbose: verbose('Increase system verbosity'),
};
export async function action(arg1:string, varidac:string[], opt:Parsed<typeof options>) {

}
