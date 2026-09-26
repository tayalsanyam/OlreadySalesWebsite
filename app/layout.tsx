import type {Metadata,Viewport} from 'next';import './style.css';
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',interactiveWidget:'resizes-content'};
export const metadata:Metadata={title:'OLREADY | For makeup artists',description:'Explore OLREADY, discover artist stories and compare plans.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
