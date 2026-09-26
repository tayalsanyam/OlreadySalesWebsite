'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="admin-login"><h1>We couldn’t load this page.</h1><p>Please try again in a moment.</p><button className="button" onClick={reset}>Try again</button><a className="text-link" href="https://wa.me/918699889901">Contact OLREADY</a></main>}
