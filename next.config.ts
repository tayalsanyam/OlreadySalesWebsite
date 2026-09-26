import type {NextConfig} from 'next';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/** App lives under a nested folder; parent repo has its own package-lock — pin Turbopack root here. */
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

const config: NextConfig = {
 turbopack: {root: turbopackRoot},
 htmlLimitedBots: /.*/,
 allowedDevOrigins: ['terminal.local'],
 async headers() {
  return [
   {
    source: '/(.*)',
    headers: [
     {key: 'X-Content-Type-Options', value: 'nosniff'},
     {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
     {key: 'Permissions-Policy', value: 'camera=(), microphone=(self)'},
     {key: 'X-Frame-Options', value: process.env.NODE_ENV === 'development' ? 'SAMEORIGIN' : 'DENY'},
    ],
   },
   ...['/admin/:path*', '/api/:path*', '/checkout', '/email-preferences', '/resume', '/dev-preview'].map((source) => ({
    source,
    headers: [
     {key: 'Cache-Control', value: 'private, no-store'},
     {key: 'X-Robots-Tag', value: 'noindex, nofollow'},
    ],
   })),
  ];
 },
};

export default config;
