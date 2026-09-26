import type {Metadata,Viewport} from 'next';import './style.css';
const appUrl=(process.env.APP_URL||'http://localhost:4170').replace(/\/$/,'');
const googleSiteVerification=process.env.GOOGLE_SITE_VERIFICATION?.trim();
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',interactiveWidget:'resizes-content'};
export const metadata:Metadata={
 metadataBase:new URL(appUrl),
 title:{default:'OLREADY | Verified enquiries for makeup artists',template:'%s'},
 description:'OLREADY connects makeup artists with verified bridal and event enquiries. Compare Pro, Phoenix and Privy plans — GST-inclusive pricing.',
 applicationName:'OLREADY',
 ...(googleSiteVerification?{verification:{google:googleSiteVerification}}:{}),
};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en-IN"><body>{children}</body></html>}
