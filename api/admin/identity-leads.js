import {db} from 'hatchable';
export const access='admin';
export const methods=['GET','POST','PATCH'];
const statuses=['a_contacter','email_envoye','relance','appel_prevu','rdv','devis','gagne','perdu','opposition'];
const clean=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
export default async function(req,res){
 if(req.method==='GET'){
   const {rows}=await db.query("SELECT id,company,contact_name,email,telephone,sector,source,status,notes,opted_out,last_contact_at,created_at FROM identity_leads ORDER BY id DESC LIMIT 300");
   return res.json({leads:rows});
 }
 const b=req.body||{};
 if(req.method==='POST'){
   const company=clean(b.company,150),contact=clean(b.contact_name,120),email=clean(b.email,254),
     tel=clean(b.telephone,40),sector=clean(b.sector,70)||'autre',source=clean(b.source,70)||'manual',notes=clean(b.notes,1000);
   if(!company||(!email&&!tel))return res.status(400).json({error:'Indique une entreprise et au moins un moyen de contact.'});
   if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Adresse email invalide.'});
   const {rows}=await db.query("INSERT INTO identity_leads(company,contact_name,email,telephone,sector,source,notes) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",[company,contact,email,tel,sector,source,notes]);
   return res.status(201).json({id:rows[0].id});
 }
 const id=Number(b.id),status=clean(b.status,40);
 if(!Number.isSafeInteger(id)||id<=0||!statuses.includes(status))return res.status(400).json({error:'Mise à jour invalide.'});
 const {rows}=await db.query("UPDATE identity_leads SET status=$1,opted_out=(opted_out OR $2),last_contact_at=CASE WHEN $1 IN ('email_envoye','relance','appel_prevu') THEN NOW() ELSE last_contact_at END,updated_at=NOW() WHERE id=$3 RETURNING id",[status,status==='opposition',id]);
 if(!rows.length)return res.status(404).json({error:'Prospect introuvable.'});
 return res.json({ok:true});
}