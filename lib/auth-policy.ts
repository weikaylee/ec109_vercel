import {createHmac} from 'node:crypto';
export function isAdminEmail(email:string,allowlist:string){return allowlist.split(',').map(e=>e.trim().toLowerCase()).filter(Boolean).includes(email.trim().toLowerCase())}
export function emailAllowed(email:string,domain:string,admins:string){return !domain||email.toLowerCase().endsWith('@'+domain.toLowerCase())||isAdminEmail(email,admins)}
export function participantKey(email:string,secret:string){if(secret.length<32)throw Error('PARTICIPANT_ID_SECRET must contain at least 32 characters');return createHmac('sha256',secret).update(email.trim().toLowerCase()).digest('hex')}
