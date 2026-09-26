import {notFound} from 'next/navigation';import {demo} from '@/lib/store';import {MobilePreview} from '@/components/MobilePreview';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}){if(!demo())notFound();const query=await searchParams;return <MobilePreview initial={query.page||'/'}/>;}
