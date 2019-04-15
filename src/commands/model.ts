import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { bool, collect, Parsed, text } from '@bitsun/mce';
import { cliPath, targetPath } from '@bitsun/mce/paths';
import { render } from '@bitsun/mce/render';
import { created, updated } from '@bitsun/mce/utils';
import { configuration } from '../utilities/configurations';
import { inflector } from '../utilities/inflector';

let {server:{name} = {name:''} } = configuration;
let appName = name;
export let description = 'Creates a new model';
export let args = '<name>';
enum States {
    no,
    updated,
    created
}
enum KaenPrimitives {
    id = 'Id',
    string = 'string',
    email = 'string',
    number = 'number',
    boolean = 'boolean',
    json = 'object',
    belongsto = 'Related<{{model}}>',
    hasone = 'Related<{{model}}>',
    hasmany = 'List<{{model}}>'
}
let valid_drivers = /mongo|mysql\-x/;
let valid_fields = Object.keys(KaenPrimitives).join('|');
let files_validation = new RegExp(`^.*:(${valid_fields})(:.*)?`);
export let options = {
    force: bool('', 'rebuilds the file'),
    driver: text('-d <driver>', 'Select the driver to connect',valid_drivers, 'mongo'),
    context: text('-c <context>', 'Context where the model will be added', `${inflector.capitalize(appName)}Context`),
    db: text('<host:database:port>', 'Database and Port to connect',/^.*\:[0-9]*$/, `localhost:${appName}_db:27017`),
    fields: collect('-f <field>', `[repetable] Field name and configuration. (name:[${valid_fields}])`, files_validation, [])
};
export async function action(name:string, opt:Parsed<typeof options>) {
    let cname = inflector.capitalize(name);
    let [host, database, port] = opt.db.split(':');
    let {context} = opt;
    let l_context = context.toLowerCase();
    let fields = opt.fields.map(f=>f.split(':')).reverse();
    if ( !existsSync(targetPath('src/models', l_context)) ) {
        mkdirSync(targetPath('src/models', l_context));
        created(targetPath('src/models', l_context));
    }
    let model_path = targetPath('src/models', l_context, `${name.toLowerCase()}.ts`);
    let context_path = targetPath('src/models', l_context, 'index.ts');
    let context_updated = States.no;
    let model_updated = States.no;
    if ( !existsSync(context_path) ) {
        context_updated = States.created;
        render(cliPath('templates/models/index.ts.tmp'), { host, database, port, context, driver:opt.driver}, context_path);
    }
    if ( !existsSync(model_path) || opt.force ) {
        model_updated = States.created;
        render(cliPath('templates/models/model.ts.tmp'), {cname, host, database, port, context}, model_path);
	}
	let ModelText = readFileSync(model_path, 'utf-8');
    let ContextText = readFileSync(context_path, 'utf-8');
    if ( /import \{ Model \} from 'vault\-orm\/adapters\/.*';/.exec(ModelText) === null) {
        ModelText = ModelText.replace(/.*import(.*)types';\n/, `import$1types';\nimport { Model } from '@bitsun/vault-orm/adapters/${opt.driver}';\n`)
    }
    for(let [property, kind] of fields) {
        let declregexp = new RegExp(`${property}:${kind}`);
        if ( !declregexp.exec(ModelText) ) {
            let model = inflector.capitalize(property);
            let decorator = '@Property';
            let primitive = KaenPrimitives[kind];
            let Property = property;
            switch(kind) {
                case 'hasmany':
                    decorator = `@HasMany(o=>${model})`;
                    Property = inflector.pluralize(property);
                    break;
                case 'belongsto':
                    decorator = `@BelongsTo(o=>${model})`;
                    break;
                case 'hasone':
                decorator = `@GasOne(o=>${model})`;
                    break;
                default:
                    decorator = '@Property';
                    break;
            }
            switch(kind) {
                case 'hasmany':
                case 'belongsto':
                case 'hasone':
                    primitive = primitive.replace('{{model}}', model);
                    if ( !new RegExp(`import.*${model}.*from.*;?`).exec(ModelText) ) {
                        ModelText = ModelText.replace(/export class(.*)\n/, `import { ${model} } from './${property}';\nexport class$1\n`);
                    } else {
						primitive = undefined;
					}
                    break;
			}
			if(primitive) {
            	ModelText = ModelText.replace(/(.*)extends Model(.*){\n/, `$1extends Model {\n\t${decorator} ${Property}:${primitive}\n`)
				if(model_updated === States.no) model_updated = States.updated;
			}
        }
    }
    writeFileSync(model_path, ModelText);
    if ( /import.*VaultORM.*/.exec(ContextText) === null) {
        ContextText = `import { VaultORM, Collection, RelationMode, collection } from '@bitsun/vault-orm/adapters/${opt.driver}';\n` + ContextText;
    }
    if ( new RegExp(`import.*${cname}.*`).exec(ContextText) === null) {
        ContextText = ContextText.replace(new RegExp(`import(.*)VaultORM(.*)\n`), `import$1VaultORM$2\nimport { ${cname} } from './${name.toLowerCase()}';\n`);
    }
    if ( !new RegExp(` Collection<${cname}>`).exec(ContextText) ) {
        ContextText = ContextText.replace(/VaultORM {\n/, `VaultORM {\n\t@collection(${cname}) ${inflector.pluralize(name)}: Collection<${cname}>\n`)
        if(context_updated === States.no) context_updated = States.updated;1
    }
    writeFileSync(context_path, ContextText);
    switch(context_updated) {
        case States.created: created(context_path);break;
        case States.updated: updated(context_path);break;
    }
    switch(model_updated) {
        case States.created: created(model_path);break;
        case States.updated: updated(model_path);break;
    }
}
