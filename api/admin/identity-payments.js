import { db, api } from 'hatchable';
export const access = 'admin';
export const methods = ['GET', 'POST'];
const clean = (v, max) => typeof v === 'string' ? v.trim().slice(0,max) : '';
export default async function(req,res) {
  if(req.method === 'GET'){
    const {rows}=await db.query("SELECT id, quote_reference, customer_name,customer_email,description,amount_cents,payment_kind,status,checkout_url,stripe_session_id,created_at FROM identity_payment_requests ORDER BY id DESC LIMIT 100");
    return res.json({payments:rows});
  }
  const input=req.body || {};
  const reference=clean(input.reference,80), name=clean(input.name,120), email=clean(input.email,254);
  const description=clean(input.description,180);
  const cents=Number(input.amount_cents), kind=input.kind;
  if(!reference || !name || !description || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !Number.isSafeInteger(cents) || cents<100 || cents>25000000 || !['one_time','monthly'].includes(kind))
    return res.status(400).json({error:'Vérifier la référence, le client, le montant à régler et le type de paiement.'});
  const {rows}=await db.query("INSERT INTO identity_payment_requests (quote_reference,customer_name,customer_email,description,amount_cents,payment_kind) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",[reference,name,email,description,cents,kind]);
  const id=rows[0].id;
  const body={
    mode:kind==='monthly'?'subscription':'payment',
    'line_items[0][price_data][currency]':'eur',
    'line_items[0][price_data][unit_amount]':String(cents),
    'line_items[0][price_data][product_data][name]':description,
    'line_items[0][quantity]':'1',
    'client_reference_id':String(id),
    'metadata[identity_payment_id]':String(id),
    'metadata[quote_reference]':reference,
    'customer_email':email,
    'success_url':'https://byidentity.dev/confirmation-paiement.html?session_id={CHECKOUT_SESSION_ID}',
    'cancel_url':'https://byidentity.dev/contact.html'
  };
  if(kind==='monthly'){
    body['line_items[0][price_data][recurring][interval]']='month';
    body['subscription_data[metadata][identity_payment_id]']=String(id);
  }
  try{
    const response=await api.stripe.post('/v1/checkout/sessions',{body});
    if(response.status<200 || response.status>=300 || !response.body?.url || !response.body?.id) throw new Error('Stripe ne fournit pas de session valide');
    await db.query("UPDATE identity_payment_requests SET status='pending',stripe_session_id=$1,checkout_url=$2,updated_at=NOW() WHERE id=$3",[response.body.id,response.body.url,id]);
    return res.status(201).json({id,checkout_url:response.body.url,status:'pending'});
  }catch(e){
    await db.query("UPDATE identity_payment_requests SET status='failed',updated_at=NOW() WHERE id=$1",[id]);
    if(e.code==='SetupRequired'||e.name==='SetupRequired')return res.status(412).json({error:'Connecte Stripe dans Hatchable > Identity > Setup > APIs, puis réessaie.'});
    return res.status(502).json({error:'Session Stripe non créée. Vérifier la connexion ou les paramètres Stripe.'});
  }
}