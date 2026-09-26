'use client';
import {useRef} from 'react';
import {X} from '@phosphor-icons/react';
import type {Site} from '@/lib/schema';
import {artistPath} from '@/lib/seo';
import {ContactForm} from './Refinements';

/** Routes “Ask about artist results” to the contact form — partner figures stay admin-only. */
export function ArtistResultContact({site,artist,label}:{site:Site;artist:Site['artists'][number];label:string}){const dialog=useRef<HTMLDialogElement>(null);const path=artistPath(artist);const prefilled=`Hi OLREADY, I would like to ask about results for ${artist.name} in ${artist.city}. Please contact me with what can be shared.`;return <><div className="artist-result-disclosure"><button type="button" className="artist-result-contact" onClick={()=>dialog.current?.showModal()}>{label}</button></div><dialog ref={dialog} className="contact-dialog" aria-label={label} onCancel={()=>dialog.current?.close()} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}><button className="icon close" type="button" onClick={()=>dialog.current?.close()} aria-label="Close contact request"><X/></button><p className="eyebrow">{site.copy.contactEyebrow}</p><h2>{label}</h2><p>{site.settings.artistDisclaimer}</p><ContactForm site={site} source={path} defaultMessage={prefilled}/><button type="button" className="text-button" onClick={()=>dialog.current?.close()}>{site.copy.contactDismiss}</button></dialog></>;}
