import {ArrowUpRight} from '@phosphor-icons/react';
import type {Site} from '@/lib/schema';
import {instagramUrl} from '@/lib/media-rules';

export function ArtistSocialRow({artist,profileLabel='View profile',onInstagramClick,onProfileClick}:{artist:Site['artists'][number];profileLabel?:string;onInstagramClick?:()=>void;onProfileClick?:()=>void}){const ig=artist.instagram&&instagramUrl(artist.instagram);if(!ig&&!artist.profileUrl)return null;return <div className="artist-social-row">{ig&&<a className="artist-instagram" href={ig} target="_blank" rel="noopener noreferrer" onClick={onInstagramClick}>@{artist.instagram!.replace(/^@/,'')}<ArrowUpRight size={14}/></a>}{artist.profileUrl&&<a className="text-link artist-profile-link" href={artist.profileUrl} onClick={onProfileClick}>{profileLabel}<ArrowUpRight size={14}/></a>}</div>;}
