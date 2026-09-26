'use client';
import Link from 'next/link';
import {ArrowRight} from '@phosphor-icons/react';
import {cityPath} from '@/lib/seo';

export function CityArtistFilter({cities,value,onChange,locked=false}:{cities:string[];value:string;onChange:(path:string)=>void;locked?:boolean}){
 if(!cities.length)return null;
 const activeName=value?cities.find(c=>cityPath(c)===value):'';
 if(locked&&value){
  return <div className="artist-city-picker artist-city-picker-locked"><p className="artist-city-picker-label">Showing</p><p className="artist-city-picker-value">{activeName}</p><Link href="/top-grossing-artists" className="text-link">All featured<ArrowRight/></Link></div>;
 }
 return <div className="artist-city-picker"><label htmlFor="artist-city-filter"><span className="artist-city-picker-label">City</span><select id="artist-city-filter" value={value} onChange={e=>onChange(e.target.value)}><option value="">All featured cities</option>{cities.map(c=><option key={c} value={cityPath(c)}>{c}</option>)}</select></label>{value&&<Link href={value} className="text-link artist-city-picker-link">{activeName}<ArrowRight/></Link>}</div>;
}
