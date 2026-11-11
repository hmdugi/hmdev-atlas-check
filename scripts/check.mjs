import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
function check(dir){for(const ent of readdirSync(dir,{withFileTypes:true})){if(ent.name.startsWith('.')||ent.name==='node_modules')continue;const path=dir+'/'+ent.name;if(ent.isDirectory())check(path);else if(path.endsWith('.js')||path.endsWith('.mjs')){const r=spawnSync(process.execPath,['--check',path],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}}}check('.');
