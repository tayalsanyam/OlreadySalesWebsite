import {content} from '@/lib/store';
import {llmsCatalog} from '@/lib/seo';

export const dynamic='force-dynamic';

export async function GET(){const site=await content();return new Response(await llmsCatalog(site),{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600'}});}
