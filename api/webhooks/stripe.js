import {webhooks,config,db} from 'hatchable';
export const access='public';
export const methods=['POST'];
export default async function(req,res){
  const secret=await config.get('STRIPE_WEBHOOK_SECRET');
  if(!secret)return res.status(503).json({error:'Webhook Stripe non configuré.'});
  const signatures=(req.headers['stripe-signature']||'').split(',');
  const ts=signatures.find(x=>x.trim().startsWith('t='))?.trim().slice(2);
  const sig=signatures.find(x=>x.trim().startsWith('v1='))?.trim().slice(3);
  if(!ts||!sig||!req.rawBody)return res.status(400).json({error:'Signature requise.'});
  const valid=await webhooks.verifyHmac({raw:ts+'.'+req.rawBody,signature:sig,secret,timestamp:ts});
  if(!valid)return res.status(400).json({error:'Signature incorrecte.'});
  const event=req.body||{};
  const session=event.data?.object||{};
  if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
    const kind=session.mode;
    const state=session.payment_status==='paid'?(kind==='subscription'?'active':'paid'):'pending';
    await db.query("UPDATE identity_payment_requests SET status=$1,stripe_subscription_id=COALESCE($2,stripe_subscription_id),updated_at=NOW() WHERE stripe_session_id=$3",[state,session.subscription||null,session.id||'']);
  }
  if(event.type==='checkout.session.async_payment_failed'||event.type==='checkout.session.expired'){
    await db.query("UPDATE identity_payment_requests SET status=$1,updated_at=NOW() WHERE stripe_session_id=$2",[event.type.endsWith('expired')?'cancelled':'failed',session.id||'']);
  }
  if(event.type==='customer.subscription.deleted'){
    await db.query("UPDATE identity_payment_requests SET status='cancelled',updated_at=NOW() WHERE stripe_subscription_id=$1",[session.id||'']);
  }
  return res.json({received:true});
}