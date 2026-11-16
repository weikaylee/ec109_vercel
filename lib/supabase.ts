import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {createClient} from '@supabase/supabase-js';
import {cookies} from 'next/headers';
function required(key:string){const value=process.env[key];if(!value)throw Error('Missing server configuration: '+key);return value}
// Used only from Route Handlers, where refreshed auth cookies can be written.
export async function authClient(){const jar=await cookies();return createServerClient(required('SUPABASE_URL'),required('SUPABASE_PUBLISHABLE_KEY'),{cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},cookies:{getAll:()=>jar.getAll(),setAll:items=>{items.forEach(({name,value,options})=>jar.set(name,value,options))}}})}
export function database(){return createClient(required('SUPABASE_URL'),required('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}})}
