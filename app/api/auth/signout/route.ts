import {authClient} from '../../../../lib/supabase';
import {sameOrigin,noStore} from '../../../../lib/access';
export async function POST(req:Request){if(!sameOrigin(req))return Response.json({error:'Invalid origin'},{status:403});const client=await authClient();await client.auth.signOut();return Response.json({ok:true},{headers:noStore})}
