import {database} from '../../../lib/supabase';
import {identity,noStore} from '../../../lib/access';
export const dynamic='force-dynamic';
export async function GET(){try{const who=await identity();if(!who)return Response.json({authenticated:false},{headers:noStore});const {data,error}=await database().rpc('register_participant',{p_key:who.key});if(error)throw error;return Response.json({authenticated:true,admin:who.admin,id:data.response_id,submitted:!!data.submitted_at},{headers:noStore})}catch{return Response.json({error:'Could not load your survey. Check server configuration.'},{status:503,headers:noStore})}}
