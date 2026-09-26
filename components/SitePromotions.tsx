'use client';
import {useEffect, useMemo, useRef, useState} from 'react';
import Link from 'next/link';
import {X, Copy} from '@phosphor-icons/react';
import type {Site} from '@/lib/schema';
import {activePromotions, type Promotion} from '@/lib/promotions';
import {ContactForm} from './Refinements';

type ResolvedPromo = Promotion & {coupon?: Site['coupons'][number]};

function storageKey(id: string) {
 return `olready_promo_dismiss_${id}`;
}

function PromoModal({site, promo, close}: {site: Site; promo: ResolvedPromo; close: () => void}) {
 const ref = useRef<HTMLDialogElement>(null);
 const code = promo.coupon?.code || promo.couponCode?.trim().toUpperCase() || '';
 const [copied, setCopied] = useState(false);
 useEffect(() => {
  ref.current?.showModal();
  return () => ref.current?.close();
 }, []);
 async function copyCode() {
  if (!code) return;
  try {
   await navigator.clipboard.writeText(code);
   setCopied(true);
   setTimeout(() => setCopied(false), 2000);
  } catch {
   /* ignore */
  }
 }
 return (
  <dialog ref={ref} className="contact-dialog promo-dialog" aria-label={promo.headline} onCancel={close} onClick={(e) => {if (e.target === e.currentTarget) close();}}>
   <button type="button" className="icon close" onClick={close} aria-label="Close promotion">
    <X />
   </button>
   {promo.image && <img className="promo-dialog__image" src={promo.image} alt="" />}
   <p className="eyebrow">OLREADY</p>
   <h2>{promo.headline}</h2>
   <p>{promo.body}</p>
   {promo.type === 'contact_popup' && <ContactForm site={site} />}
   {promo.type === 'coupon_modal' && code && (
    <div className="promo-code-block">
     <code>{code}</code>
     <button type="button" onClick={copyCode}>
      <Copy size={18} /> {copied ? 'Copied' : 'Copy code'}
     </button>
     <Link className="button primary" href={`/checkout?coupon=${encodeURIComponent(code)}`} onClick={close}>
      {promo.ctaLabel || 'Go to checkout'}
     </Link>
    </div>
   )}
   <button type="button" className="text-button" onClick={close}>
    {site.copy.contactDismiss || 'Maybe later'}
   </button>
  </dialog>
 );
}

function PromoSidebar({site, promo}: {site: Site; promo: ResolvedPromo}) {
 const code = promo.coupon?.code || promo.couponCode?.trim().toUpperCase() || '';
 const [copied, setCopied] = useState(false);
 const [hidden, setHidden] = useState(false);
 useEffect(() => {
  try {
   if (sessionStorage.getItem(storageKey(promo.id)) === '1') setHidden(true);
  } catch {
   /* ignore */
  }
 }, [promo.id]);
 if (hidden) return null;
 async function copyCode() {
  if (!code) return;
  try {
   await navigator.clipboard.writeText(code);
   setCopied(true);
  } catch {
   /* ignore */
  }
 }
 function dismiss() {
  try {
   sessionStorage.setItem(storageKey(promo.id), '1');
  } catch {
   /* ignore */
  }
  setHidden(true);
 }
 return (
  <aside className="promo-sidebar" aria-label={promo.headline}>
   <button type="button" className="icon promo-sidebar__close" onClick={dismiss} aria-label="Dismiss offer">
    <X />
   </button>
   {promo.image && <img src={promo.image} alt="" />}
   <strong>{promo.headline}</strong>
   <p>{promo.body}</p>
   {code && (
    <>
     <code className="promo-sidebar__code">{code}</code>
     <div className="promo-sidebar__actions">
      <button type="button" onClick={copyCode}>
        {copied ? 'Copied' : 'Copy'}
      </button>
      <Link href={`/checkout?coupon=${encodeURIComponent(code)}`}>{promo.ctaLabel || 'Checkout'}</Link>
     </div>
    </>
   )}
  </aside>
 );
}

export function SitePromotions({site, path}: {site: Site; path: string}) {
 const [modal, setModal] = useState<ResolvedPromo | null>(null);
 const promos = useMemo(() => activePromotions(site, path), [site, path]);
 const sidebar = promos.find((p) => p.type === 'sidebar_banner');
 const modalCandidate = promos.find((p) => p.type === 'contact_popup' || p.type === 'coupon_modal');

 useEffect(() => {
  if (!modalCandidate) return;
  try {
   if (localStorage.getItem(storageKey(modalCandidate.id)) === '1') return;
  } catch {
   /* ignore */
  }
  const delay = Math.max(0, modalCandidate.delaySeconds) * 1000;
  const t = setTimeout(() => setModal(modalCandidate), delay);
  return () => clearTimeout(t);
 }, [modalCandidate?.id, modalCandidate?.delaySeconds]);

 function closeModal() {
  if (modal) {
   try {
    localStorage.setItem(storageKey(modal.id), '1');
   } catch {
    /* ignore */
   }
  }
  setModal(null);
 }

 return (
  <>
   {sidebar && <PromoSidebar site={site} promo={sidebar} />}
   {modal && <PromoModal site={site} promo={modal} close={closeModal} />}
  </>
 );
}
