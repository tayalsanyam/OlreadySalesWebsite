import type {AssistantSession,State} from './schema';
import {staffNotifyAssistantChat} from './staff-notify';

const MAX_SESSIONS=120;

export function trimAssistantSessions(s:State){
 if(!s.assistantSessions?.length)return;
 if(s.assistantSessions.length>MAX_SESSIONS)s.assistantSessions.length=MAX_SESSIONS;
}

export function findAssistantSession(s:State,id:string){
 return s.assistantSessions?.find(x=>x.id===id&&!x.completed);
}

export function completeAssistantSession(s:State,id:string){
 const session=s.assistantSessions?.find(x=>x.id===id);
 if(!session||session.completed)return session;
 session.completed=true;
 staffNotifyAssistantChat(s,session);
 return session;
}

export function appendAssistantMessage(session:AssistantSession,role:'user'|'assistant',text:string){
 session.messages.push({role,text:text.slice(0,4000)});
 if(session.messages.length>40)session.messages.splice(0,session.messages.length-40);
}
