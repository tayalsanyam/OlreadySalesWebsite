import {createHash,randomBytes} from 'node:crypto';
export const secret=()=>randomBytes(32).toString('hex');
export const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
