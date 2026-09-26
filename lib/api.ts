import {NextRequest,NextResponse} from 'next/server';
export function sameOrigin(req:NextRequest){const origin=req.headers.get('origin');const host=req.headers.get('host');if(!origin||new URL(origin).host!==host)throw new Error('Invalid request origin');}
export async function json(req:NextRequest,maxBytes=300000){if(Number(req.headers.get('content-length')||0)>maxBytes)throw new Error('Request too large');const raw=await req.text();if(raw.length>maxBytes)throw new Error('Request too large');return JSON.parse(raw);}
export function fail(e:unknown,status=400){return NextResponse.json({error:e instanceof Error?e.message:'Request could not be completed'},{status});}
