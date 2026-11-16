import {db} from 'hatchable';
export const access='public';
export const methods=['POST'];
export default async function(req,res){
 const b=req.body||{};
 if(b.website)return res.json({ok:true});
 const name=typeof b.name==='string'?b.name.trim():'';
 const email=typeof b.email==='string'?b.email.trim():'';
 const message=typeof b.message==='string'?b.message.trim():'';
 if(name.length<2||name.length>120||message.length<10||message.length>1500||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)
  return res.status(400).json({error:'Merci de renseigner votre nom, un e-mail valide et un message de 10 à 1 500 caractères.'});
 const exists=await db.query("SELECT id FROM identity_leads WHERE email=$1 AND source='site_contact' AND created_at>NOW()-INTERVAL '2 minutes' LIMIT 1",[email]);
 if(exists.rows.length)return res.status(429).json({error:'Votre demande a déjà été reçue récemment.'});
 await db.query("INSERT INTO identity_leads(company,contact_name,email,sector,source,status,notes) VALUES($1,$2,$3,'autre','site_contact','a_contacter',$4)",['Demande depuis Identity',name,email,message]);
 return res.status(201).json({ok:true});
}