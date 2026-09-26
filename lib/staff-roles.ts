export const STAFF_ROLES=['admin','editor','commercial','sales'] as const;
export type StaffRole=(typeof STAFF_ROLES)[number];

export const ROLE_LABELS:Record<StaffRole,string>={admin:'Administrator',editor:'Content editor',commercial:'Commercial',sales:'Sales'};

/** Workspace areas each role can use (matches API enforcement). */
export const ROLE_ACCESS:Record<StaffRole,{summary:string;sections:string[];restrictions:string[]}>={
 admin:{summary:'Full workspace, publish, team management, payments reconciliation, AI documents, delivery queue.',sections:['Overview','All website content','Plans, coupons, settings','Publish to live site','Orders (full)','Subscribers & delivery queue','Versions & audit','Team & access','AI knowledge documents'],restrictions:[]},
 editor:{summary:'Website stories, artists, FAQs, and media. Cannot change plans, coupons, site policies, or publish.',sections:['Overview','Page content, artists, directory, FAQs, metrics','Buttons & shared copy (content areas)','Email template editing (draft)','Media uploads'],restrictions:['Cannot publish','Cannot edit plans, coupons, recovery, assistant settings, or legal/policy fields','No orders, subscribers, jobs, history, or team management']},
 commercial:{summary:'Plans and pricing plus order operations. Cannot publish site-wide content.',sections:['Overview','Plans & pricing','Coupons','Email templates (preview)','Orders (reconcile, link Razorpay, requeue emails)','Carts & contacts (read via admin load)'],restrictions:['Cannot publish','Content edits limited to plans and coupons only','No team management or AI knowledge admin']},
 sales:{summary:'Customer activity and order follow-up. No CMS or payment reconciliation.',sections:['Overview','Orders & payments (view, export, follow-up notes)','Visitor journeys','Saved carts','Contact requests (status updates)'],restrictions:['Cannot reconcile Razorpay or requeue purchase emails','No website editing, publish, subscribers, or team management']},
};

export const ADMIN_NAV_IDS=['overview','pages','copy','metrics','artists','directory','plans','faqs','settings','coupons','templates','assistant','recovery','orders','journeys','carts','contacts','subscribers','jobs','history','team'] as const;

export function navIdsForRole(role:StaffRole):string[]{if(role==='sales')return ['overview','orders','journeys','carts','contacts'];if(role==='editor')return ADMIN_NAV_IDS.filter(id=>!['coupons','recovery','orders','journeys','carts','contacts','subscribers','jobs','history','team'].includes(id));if(role==='commercial')return ['overview','plans','coupons','templates','orders','journeys','carts','contacts'];return [...ADMIN_NAV_IDS];}
