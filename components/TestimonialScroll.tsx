'use client';
import type {Site} from '@/lib/schema';

export function TestimonialScroll({site,title,eyebrow='ARTIST VOICES'}:{site:Site;title?:string;eyebrow?:string}){const items=site.testimonials||[];if(!items.length)return null;return <section className="section testimonial-scroll" aria-label="Artist testimonials"><div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title||'Stories from the community'}</h2></div></div><div className="testimonial-scroll-track" role="list">{items.map(t=><article key={t.id} role="listitem"><video controls preload="metadata" src={t.video} poster={t.poster||undefined}/><h3>{t.title}</h3>{t.caption&&<p>{t.caption}</p>}</article>)}</div></section>;}
