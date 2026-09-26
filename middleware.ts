import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

/** Partner website: staff auth is handled in /api/auth and route handlers, not edge middleware. */
export function middleware(_request:NextRequest){return NextResponse.next();}

export const config={matcher:[]};
