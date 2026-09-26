import type {Site} from './schema';
import {slugify} from './seo';

export type CatalogArtist=Site['artists'][number];

export function suggestArtistSlug(a:Pick<CatalogArtist,'name'|'city'|'services'|'slug'>){const custom=a.slug?.trim();if(custom)return custom;const service=a.services?.[0]?slugify(a.services[0]).replace(/-makeup|-artist/g,'').slice(0,24):'';const base=[slugify(a.name),service&&service!=='bridal'?service:'',a.city?slugify(a.city):'','mua'].filter(Boolean).join('-').replace(/-+/g,'-').slice(0,80);return base||'artist';}

export function publishedArtist(a:CatalogArtist){return a.approved&&a.consent&&!!a.name.trim()&&!!a.city.trim()&&!!a.bio?.trim()&&!!a.image;}

export function featuredArtist(a:CatalogArtist){return publishedArtist(a)&&!!a.featuredTopGrossing;}

export function featuredArtists(site:Site){return site.artists.filter(featuredArtist);}

export function publishedArtists(site:Site){return site.artists.filter(publishedArtist);}

export function directoryRowToArtist(row:Site['directory'][number]):CatalogArtist{return {id:row.id,slug:suggestArtistSlug({name:row.name,city:row.city,services:row.services,slug:''}),name:row.name,city:row.city,bio:row.bio.slice(0,1500),keywords:row.keywords,instagram:row.instagram,services:row.services,gallery:[],image:row.image,profileUrl:row.profileUrl,amountPaise:null,definition:'Gross booking value',period:'',evidence:'',consent:row.consent,approved:row.approved,featuredTopGrossing:false,expires:'',video:'',poster:'',transcript:''};}

export function mergeDirectoryIntoArtists(site:Site){site.directory??=[];if(!site.directory.length)return;const known=new Set(site.artists.map(a=>a.profileUrl?`url:${a.profileUrl.toLowerCase()}`:`name:${a.name.toLowerCase()}|${a.city.toLowerCase()}`));for(const row of site.directory){const key=row.profileUrl?`url:${row.profileUrl.toLowerCase()}`:`name:${row.name.toLowerCase()}|${row.city.toLowerCase()}`;if(known.has(key)||site.artists.some(a=>a.id===row.id))continue;site.artists.push(directoryRowToArtist(row));known.add(key);}site.directory=[];}

export function upgradeArtistCatalog(site:Site){mergeDirectoryIntoArtists(site);for(const a of site.artists){if(a.featuredTopGrossing===undefined)a.featuredTopGrossing=a.approved&&!!a.amountPaise&&!!a.evidence;if(!a.slug?.trim())a.slug=suggestArtistSlug(a);if(!a.gallery)a.gallery=[];if(a.bio&&a.bio.length>1500)a.bio=a.bio.slice(0,1500);}site.testimonials??=[];}
