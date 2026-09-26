export const mediaTypes:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','application/pdf':'pdf'};
export const mediaLimit=20*1024*1024;
/** Folder prefixes inside the single public `partner-media` bucket. */
export const mediaFolders=['artists','testimonials','site'] as const;
export type MediaFolder=typeof mediaFolders[number];
const folderSet=new Set<string>(mediaFolders);
export function parseMediaFolder(value:unknown):MediaFolder{return typeof value==='string'&&folderSet.has(value)?value as MediaFolder:'site';}
export function validateMedia(type:string,size:number){if(!mediaTypes[type])throw new Error('Use JPG, PNG, WebP or MP4.');if(!Number.isInteger(size)||size<=0||size>mediaLimit)throw new Error('Choose a non-empty file up to 20 MB.');return mediaTypes[type];}
export function instagramUrl(handle:string){return /^@?[A-Za-z0-9._]{1,30}$/.test(handle)?`https://www.instagram.com/${handle.replace(/^@/,'')}/`:'';}
