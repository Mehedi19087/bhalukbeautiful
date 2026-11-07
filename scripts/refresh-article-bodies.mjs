import {load} from 'cheerio';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import fs from 'node:fs';
const run=promisify(execFile),d=JSON.parse(fs.readFileSync('src/data/reference.json'));
await Promise.all(d.homeIds.slice(0,18).map(async id=>{try{const {stdout}=await run('curl',['-Ls','--max-time','15','https://www.mzamin.com/article/'+id]);const $=load(stdout);$('article br').replaceWith('\n\n');const paragraphs=$('article p').map((i,e)=>$(e).text()).get().flatMap(t=>t.split(/\n\s*\n/)).map(t=>t.trim()).filter(t=>t.length>65);if(paragraphs.length)d.articles[id].body=paragraphs;}catch{}}));fs.writeFileSync('src/data/reference.json',JSON.stringify(d,null,2));console.log('Article paragraphs updated');
