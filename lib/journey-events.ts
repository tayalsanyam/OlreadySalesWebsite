/** First-party journey analytics (consent-gated). Shared by client + /api/events. */
export const journeyEventNames = [
 'page_view',
 'plan_finder_choice',
 'plan_selected',
 'whatsapp_click',
 'merchant_click',
 'video_play',
 'instagram_click',
 'assistant_open',
 'assistant_started',
 'assistant_question',
 'checkout_saved',
 'payment_started',
 'payment_paid',
 'payment_failed',
] as const;

export type JourneyEventName = (typeof journeyEventNames)[number];
