'use client';
import Image from 'next/image';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowUpRight} from '@phosphor-icons/react';
import type {Site} from '@/lib/schema';
import {artistPath,cityPath} from '@/lib/seo';

function Card({artist}:{artist:Site['artists'][number]}){
 return <article className="artist-marquee-card"><Link href={artistPath(artist)} className="artist-marquee-media">{artist.image&&<Image src={artist.image} alt={artist.name} width={480} height={560} className="artist-marquee-photo" unoptimized/>}<span className="artist-marquee-shade"/><span className="artist-marquee-meta"><strong>{artist.name}</strong><small>{artist.city}</small></span></Link><div className="artist-marquee-foot"><Link href={cityPath(artist.city)} className="artist-marquee-city">{artist.city}</Link><Link href={artistPath(artist)} className="artist-marquee-cta">View profile<ArrowUpRight size={14}/></Link></div></article>;
}

export function HomepageArtistMarquee({artists,motion=true}:{artists:Site['artists'][number][];motion?:boolean}){
 const [paused,setPaused]=useState(false);
 const [reduceMotion,setReduceMotion]=useState(false);
 useEffect(()=>{const mq=window.matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduceMotion(mq.matches);sync();mq.addEventListener('change',sync);return()=>mq.removeEventListener('change',sync);},[]);
 if(!artists.length)return null;
 const loop=[...artists,...artists];
 const auto=motion&&!reduceMotion;
 const duration=Math.max(48,artists.length*9);
 return <div className="artist-marquee-shell" onMouseEnter={()=>setPaused(true)} onFocusCapture={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onBlurCapture={()=>setPaused(false)}><div className="artist-marquee-edge artist-marquee-edge-left" aria-hidden/><div className={'artist-marquee-viewport'+(auto?'':' artist-marquee-manual')}><div className={'artist-marquee-track'+(auto?'':' artist-marquee-manual')+(paused&&auto?' is-paused':'')} style={auto?({['--marquee-duration' as string]:`${duration}s`}):undefined} role="list" aria-label="Featured makeup artists">{loop.map((a,i)=><div key={`${a.id}-${i}`} role="listitem"><Card artist={a}/></div>)}</div></div><div className="artist-marquee-edge artist-marquee-edge-right" aria-hidden/></div>;
}
