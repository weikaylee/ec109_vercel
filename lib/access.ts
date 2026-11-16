import 'server-only';
import {authClient} from './supabase';
import {emailAllowed,isAdminEmail,participantKey} from './auth-policy';
export async function identity(){const client=await authClient();const {data:{user},error}=await client.auth.getUser();if(error||!user?.email||!user.email_confirmed_at)return null;const admins=process.env.ADMIN_EMAILS||'';if(!emailAllowed(user.email,process.env.ALLOWED_EMAIL_DOMAIN||'',admins))return null;return {key:participantKey(user.email,process.env.PARTICIPANT_ID_SECRET||''),admin:isAdminEmail(user.email,admins)}}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');return !!origin&&origin===new URL(req.url).origin}
export const noStore={'Cache-Control':'private, no-store, max-age=0'};
