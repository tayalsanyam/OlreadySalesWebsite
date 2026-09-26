/** Visitor asked for human follow-up (callback, call, speak to team). */
export function wantsCallbackHandoff(message: string) {
 const q = message.toLowerCase().replace(/\s+/g, ' ');
 return (
  /\b(call me back|callback|call back|ring me|phone me|give me a call)\b/.test(q) ||
  /\b(arrange|schedule|set up|book)\s+(a\s+)?(call|callback|phone call)\b/.test(q) ||
  /\b(speak|talk)\s+(to|with)\s+(someone|a person|human|your team|the team|olready)\b/.test(q) ||
  (/\b(human|real person|someone from the team)\b/.test(q) && /\b(speak|talk|connect|contact|call)\b/.test(q)) ||
  /\b(arrange|okay|ok)\b.*\b(call|callback)\b/.test(q) ||
  /\b(contact me|reach out|get back to me|follow up with me)\b/.test(q) ||
  /\bcan (you|someone) call\b/.test(q)
 );
}

export function callbackAcknowledgement(supportHours: string) {
 const hours = supportHours?.trim() ? ` Our published support hours: ${supportHours.trim()}.` : '';
 return `Thanks — I've shared your request with our team. Someone will follow up using the name and mobile you provided.${hours} For a quicker chat, you can also use WhatsApp below.`;
}
