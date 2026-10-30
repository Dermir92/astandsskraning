import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
createServer(async(req,res)=>{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    if(pathname==='/'){res.writeHead(302,{Location:'/qa/ui2a-implementation/'});return res.end();}
    if(!pathname.startsWith('/qa/ui2a-implementation/')&&!pathname.startsWith('/ui2a/')){res.writeHead(404);return res.end();}
    let file=path.resolve(docs,'.'+pathname);
    if(!file.startsWith(docs+path.sep)){res.writeHead(403);return res.end();}
    if((await stat(file)).isDirectory())file=path.join(file,'index.html');
    const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(404);res.end('Fannst ekki');}
}).listen(3223,'127.0.0.1',()=>console.log('UI2A implementation review: http://127.0.0.1:3223/qa/ui2a-implementation/'));
