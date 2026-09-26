import {access} from 'node:fs/promises';
await Promise.all(['public/hero.png','app/style.css'].map(p=>access(p)));
console.log('OLREADY Sales V10 — bundled image and stylesheet found.');
import {spawn} from 'node:child_process';
const args=process.argv.slice(2), port=args.includes('--port')?args[args.indexOf('--port')+1]:'4170';
const p=spawn('node',['node_modules/next/dist/bin/next','dev','--hostname','0.0.0.0','--port',port],{stdio:'inherit'}); p.on('exit',code=>process.exit(code??0));
