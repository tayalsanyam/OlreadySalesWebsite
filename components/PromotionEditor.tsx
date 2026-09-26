'use client';
import {useState} from 'react';
import {Plus} from '@phosphor-icons/react';
import type {Site} from '@/lib/schema';
import {Asset, Field} from './TaskEditors';

type Props = {site: Site; onChange: (s: Site) => void};

const typeLabels = {
 contact_popup: 'Contact popup',
 coupon_modal: 'Coupon modal',
 sidebar_banner: 'Sidebar banner',
} as const;

export function PromotionEditor({site, onChange}: Props) {
 const list = site.promotions || [];
 const [selected, setSelected] = useState(list[0]?.id || '');
 const promo = list.find((p) => p.id === selected);
 const patch = (v: Partial<(typeof list)[number]>) =>
  onChange({...site, promotions: list.map((p) => (p.id === selected ? {...p, ...v} : p))});

 function add() {
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);
  const id = crypto.randomUUID();
  onChange({
   ...site,
   promotions: [
    ...list,
    {
     id,
     enabled: false,
     type: 'coupon_modal',
     headline: 'Festival offer',
     body: 'Use this code at checkout.',
     couponId: '',
     couponCode: '',
     image: '',
     ctaLabel: 'Go to checkout',
     pages: 'home_plans',
     starts: now.toISOString(),
     ends: end.toISOString(),
     delaySeconds: 30,
    },
   ],
  });
  setSelected(id);
 }

 return (
  <div className="task-section">
   <div className="task-heading">
    <div>
     <h2>Promotions</h2>
     <p>Contact popups, coupon modals and sidebar banners. Save draft, then publish. Checkout excludes modals; sidebar can show on allowed pages.</p>
    </div>
    <button type="button" className="primary" onClick={add}>
     <Plus /> Add promotion
     </button>
   </div>
   {!list.length && <p className="preview-caption">No promotions yet. Legacy popup settings migrate automatically on first load.</p>}
   {list.length > 0 && (
    <>
     <div className="template-picker">
      {list.map((p) => (
       <button type="button" className={selected === p.id ? 'chosen' : ''} key={p.id} onClick={() => setSelected(p.id)}>
        <span>
         <strong>{p.headline || 'Untitled'}</strong>
         <small>
          {typeLabels[p.type]} · {p.enabled ? 'Enabled' : 'Paused'}
         </small>
        </span>
       </button>
      ))}
     </div>
     {promo && (
      <div className="task-split">
       <div className="task-section">
        <label className="task-field">
         Type
         <select value={promo.type} onChange={(e) => patch({type: e.target.value as typeof promo.type})}>
          {Object.entries(typeLabels).map(([k, label]) => (
           <option key={k} value={k}>
            {label}
           </option>
          ))}
         </select>
        </label>
        <Field title="Headline" value={promo.headline} change={(headline) => patch({headline})} />
        <Field title="Body" value={promo.body} multi change={(body) => patch({body})} />
        <label className="task-field">
         Show on pages
         <select value={promo.pages} onChange={(e) => patch({pages: e.target.value as typeof promo.pages})}>
          <option value="all">All pages (not checkout/legal)</option>
          <option value="home">Home only</option>
          <option value="plans">Plans only</option>
          <option value="home_plans">Home & plans</option>
         </select>
        </label>
        {(promo.type === 'coupon_modal' || promo.type === 'sidebar_banner') && (
         <>
          <label className="task-field">
           Link to coupon (optional)
           <select value={promo.couponId} onChange={(e) => patch({couponId: e.target.value, couponCode: ''})}>
            <option value="">— Manual code below —</option>
            {site.coupons.map((c) => (
             <option key={c.id} value={c.id}>
              {c.code} {c.enabled ? '' : '(paused)'}
             </option>
            ))}
           </select>
          </label>
          <Field title="Or coupon code" value={promo.couponCode} change={(couponCode) => patch({couponCode: couponCode.toUpperCase().replace(/\s/g, ''), couponId: ''})} />
          <Field title="CTA button label" value={promo.ctaLabel} change={(ctaLabel) => patch({ctaLabel})} hint="e.g. Go to checkout" />
         </>
        )}
        {(promo.type === 'contact_popup' || promo.type === 'coupon_modal') && (
         <label className="task-field">
          Delay before show (seconds)
          <input type="number" min={0} max={300} value={promo.delaySeconds} onChange={(e) => patch({delaySeconds: Number(e.target.value)})} />
         </label>
        )}
        <div className="form-grid">
         <Field title="Starts (IST date)" type="date" value={promo.starts.slice(0, 10)} change={(v) => patch({starts: v ? v + 'T00:00:00+05:30' : ''})} />
         <Field title="Ends (IST date)" type="date" value={promo.ends.slice(0, 10)} change={(v) => patch({ends: v ? v + 'T23:59:59+05:30' : ''})} />
        </div>
       </div>
       <aside className="task-section">
        <label className="toggle">
         <input type="checkbox" checked={promo.enabled} onChange={(e) => patch({enabled: e.target.checked})} />
         Enabled after publish
        </label>
        <Asset folder="site" title="Promo image (optional)" value={promo.image || ''} change={(image) => patch({image})} />
        <p className="preview-caption">Coupon modals support Copy code and checkout link with ?coupon=. Sidebar shows on the right on desktop.</p>
        <button type="button" className="danger-link" onClick={() => {onChange({...site, promotions: list.filter((p) => p.id !== selected)}); setSelected('');}}>
         Remove promotion
        </button>
       </aside>
      </div>
     )}
    </>
   )}
  </div>
 );
}
