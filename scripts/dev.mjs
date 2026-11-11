import http from 'node:http';
import {readFile,readdir} from 'node:fs/promises';
const allowed=new Set((await readdir('.')).filter(p=>/\.(html|css|js|json|svg)$/.test(p)&&!['package.json','vercel.json'].includes(p)));
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',json:'application/json',svg:'image/svg+xml'};
const value=(name,fallback)=>process.argv.includes(name)?process.argv[process.argv.indexOf(name)+1]:fallback;
http.createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!allowed.has(path)){res.writeHead(404);res.end('Not found');return;}res.setHeader('Content-Type',types[path.split('.').at(-1)]);res.setHeader('Cache-Control','no-store');res.end(await readFile(path));}catch{res.writeHead(500);res.end('Error');}}).listen(Number(process.env.PORT||value('--port',3000)),value('--host','127.0.0.1'));
