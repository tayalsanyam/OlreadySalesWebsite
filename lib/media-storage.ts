import {randomUUID} from 'node:crypto';
import type {MediaFolder} from './media-rules';
export function mediaObjectPath(folder:MediaFolder,ext:string){if(!/^[a-z0-9]+$/.test(ext))throw new Error('Invalid media extension');return `${folder}/${randomUUID()}.${ext}`;}
