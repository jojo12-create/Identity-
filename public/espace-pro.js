(()=>{'use strict';
const $=q=>document.querySelector(q);
const api={leads:'/api/admin/identity-leads',payments:'/api/admin/identity-payments'};
const steps={a_contacter:'À contacter',email_envoye:'E-mail envoyé',relance:'Relance effectuée',appel_prevu:'Appel à passer',rdv:'Rendez-vous',devis:'Devis envoyé',gagne:'Client gagné',perdu:'Perdu',opposition:'Ne plus contacter'};
const sectors={plombier:'Plomberie',electricien:'Électricité',osteopathe:'Ostéopathie',restaurant:'Restaurant / bar',autre:'Autre'};
let leads=[],payments=[];
function message(t,isError=false){const el=$('#feedback');el.textContent=t||'';el.classList.toggle('error',isError)}
async function request(url,options={}){
 const r=await fetch(url,{redirect:'manual',...options});
 if(r.status===401||r.type==='opaqueredirect'){let url='https://hatchable.com/console/login';if(r.status===401){const d=await r.json().catch(()=>({}));url=d.login_url||url}location.href=url;throw Error('Authentification nécessaire')}
 if(r.status===403){throw Error('Accès administrateur requis.')}
 const body=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(body.error||'Erreur lors de la demande');
 return body;
}
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n}
function renderStats(){
 const data=[
 ['Prospects enregistrés',leads.length],
 ['Premier contact effectué',leads.filter(x=>['email_envoye','relance','appel_prevu','rdv','devis','gagne','perdu'].includes(x.status)).length],
 ['Rendez-vous / devis',leads.filter(x=>['rdv','devis'].includes(x.status)).length],
 ['Clients gagnés',leads.filter(x=>x.status==='gagne').length]
 ];
 const root=$('#stats');root.replaceChildren();
 data.forEach(([label,value])=>{const c=el('article',undefined,'metric');c.append(el('small',label),el('strong',value),el('span','Données CRM réelles'));root.append(c)})
}
function renderLeads(){
 const tbody=$('#lead-rows');tbody.replaceChildren();$('#lead-count').textContent=leads.length+' contacts';
 if(!leads.length){const tr=el('tr');const td=el('td','Aucun prospect enregistré.');td.colSpan=4;tr.append(td);tbody.append(tr);return}
 leads.forEach(item=>{
  const tr=el('tr');
  const name=el('td');name.append(el('strong',item.company),el('div',item.contact_name||'','muted'));
  const sector=el('td',sectors[item.sector]||item.sector);
  const ct=el('td');if(item.email){const a=el('a',item.email);a.href='mailto:'+encodeURIComponent(item.email).replace(/%40/g,'@');ct.append(a)}
  if(item.telephone)ct.append(el('div',item.telephone,'muted'));
  const state=el('td'),select=el('select');select.setAttribute('aria-label','Étape pour '+item.company);
  Object.entries(steps).forEach(([val,label])=>{const opt=el('option',label);opt.value=val;select.append(opt)});
  select.value=item.status;
  if(item.opted_out && item.status!=='opposition')select.value='opposition';
  select.addEventListener('change',async()=>{
   const old=item.status;select.disabled=true;
   try{await request(api.leads,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id,status:select.value})});message('Étape du prospect enregistrée.');await loadLeads()}
   catch(e){select.value=old;message(e.message,true)}
   finally{select.disabled=false}
  });state.append(select);tr.append(name,sector,ct,state);tbody.append(tr);
 })
}
function renderPayments(){
 const tbody=$('#payment-rows');tbody.replaceChildren();$('#payment-count').textContent=payments.length+' demandes';
 if(!payments.length){const tr=el('tr'),td=el('td','Aucun lien créé.');td.colSpan=5;tr.append(td);tbody.append(tr);return}
 payments.forEach(item=>{
 const tr=el('tr');
 tr.append(el('td',item.quote_reference),el('td',item.customer_name),
 el('td',(Number(item.amount_cents)/100).toLocaleString('fr-FR',{style:'currency',currency:'EUR'})+(item.payment_kind==='monthly'?'/mois':'')),
 el('td',({draft:'Brouillon',pending:'En attente',paid:'Payé',active:'Actif',failed:'Erreur',cancelled:'Annulé'}[item.status]||item.status)));
 const td=el('td');
 if(item.checkout_url){const a=el('a','Ouvrir le lien ↗');a.href=item.checkout_url;a.target='_blank';a.rel='noopener noreferrer';td.append(a);
  const copy=el('button','Copier','copy-link');copy.type='button';copy.style.cssText='margin-left:10px;border:0;background:none;cursor:pointer;text-decoration:underline;color:#456959';copy.addEventListener('click',()=>navigator.clipboard.writeText(item.checkout_url).then(()=>message('Lien copié.')).catch(()=>message('Copie indisponible.',true)));td.append(copy)}
 else td.append(el('span','—'));
 tr.append(td);tbody.append(tr)
 })
}
async function loadLeads(){const data=await request(api.leads);leads=data.leads||[];renderLeads();renderStats()}
async function loadPayments(){const data=await request(api.payments);payments=data.payments||[];renderPayments()}
const templates=[
 {name:'Plombiers',subject:'Une idée pour la visibilité de {ENTREPRISE}',body:'Bonjour,\n\nEn recherchant des entreprises de plomberie à {VILLE}, j’ai découvert {ENTREPRISE}. {OBSERVATION_REELLE_SUR_LEUR_PRESENCE_EN_LIGNE}\n\nJe travaille chez Identity, un studio qui crée des sites web adaptés aux artisans : présentation des interventions, zones desservies et demandes de devis sur mobile.\n\nEst-ce que je peux vous envoyer deux ou trois idées concrètes pour votre présence en ligne ?\n\nBien cordialement,\nIdentity — byidentity.dev\n\nSi vous préférez ne plus être contacté, répondez simplement « stop ».'},
 {name:'Électriciens',subject:'{ENTREPRISE} : une question sur votre site web',body:'Bonjour,\n\nJe me permets de vous contacter au sujet de {ENTREPRISE}, à {VILLE}. {OBSERVATION_REELLE_SUR_LEUR_PRESENCE_EN_LIGNE}\n\nChez Identity, nous aidons les électriciens à présenter clairement leurs spécialités, leurs réalisations et leurs coordonnées, sur un site lisible aussi bien sur téléphone que sur ordinateur.\n\nSeriez-vous ouvert à recevoir un exemple de ce que nous pourrions améliorer pour votre activité ?\n\nBien cordialement,\nIdentity — byidentity.dev\n\nSi ce sujet ne vous concerne pas, répondez « stop » et je ne vous recontacterai pas.'},
 {name:'Ostéopathes',subject:'Une suggestion pour votre présence en ligne à {VILLE}',body:'Bonjour,\n\nEn découvrant votre cabinet {ENTREPRISE}, j’ai noté {OBSERVATION_REELLE_SUR_LEUR_SITE}.\n\nIdentity accompagne les indépendants dans la création de sites clairs, soignés et adaptés au mobile. Pour un cabinet, l’objectif est surtout de rendre accessibles les informations pratiques, les motifs de consultation et la prise de rendez-vous.\n\nPuis-je vous transmettre une proposition courte et personnalisée ?\n\nBien cordialement,\nIdentity — byidentity.dev\n\nUn simple « stop » suffit si vous ne souhaitez pas être recontacté.'},
 {name:'Restaurants & bars',subject:'Une idée de site pour {ENTREPRISE}',body:'Bonjour,\n\nJe suis tombé sur {ENTREPRISE} à {VILLE} et j’ai apprécié {DETAIL_REEL_SUR_LE_LIEU}.\n\nJe travaille chez Identity, où nous concevons des sites web pour restaurants et commerces : univers visuel fidèle au lieu, carte, horaires et réservations faciles à trouver.\n\nEst-ce que je peux vous montrer une courte proposition de présentation adaptée à votre établissement ?\n\nBien à vous,\nIdentity — byidentity.dev\n\nDites-moi « stop » si vous ne souhaitez pas d’autre message.'},
 {name:'Relance courte · J+4 à J+6',subject:'Re : {OBJET_DU_PREMIER_EMAIL}',body:'Bonjour,\n\nJe me permets une dernière relance concernant mon message sur le site web de {ENTREPRISE}.\n\nEst-ce un sujet d’actualité pour vous, ou préférez-vous que je n’insiste pas ?\n\nBonne journée,\nIdentity — byidentity.dev\n\nSi vous ne souhaitez plus de message, répondez « stop ».'}
];
function renderTemplates(){
 const root=$('#template-cards');root.replaceChildren();
 templates.forEach(x=>{
 const card=el('article',undefined,'template');
 card.append(el('span','E-MAIL / IDENTITY','kicker'),el('h3',x.name),el('div','Objet : '+x.subject,'subject'));
 const body=el('pre',x.body);card.append(body);
 const b=el('button','Copier objet + message ↗');b.type='button';
 b.addEventListener('click',()=>navigator.clipboard.writeText('Objet : '+x.subject+'\n\n'+x.body).then(()=>message('Modèle copié. Personnalisez les champs avant envoi.')).catch(()=>message('Copie indisponible.',true)));
 card.append(b);root.append(card)
 })
}
document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===btn));
 document.querySelectorAll('[data-panel]').forEach(x=>x.classList.toggle('hidden',x.dataset.panel!==btn.dataset.tab));
 const titles={overview:'Vue d’ensemble',leads:'Prospects',templates:'E-mails types',payments:'Paiements'};
 $('#page-title').textContent=titles[btn.dataset.tab];$('#page-title').append(el('span','.'));message('');
}));
$('#lead-form').addEventListener('submit',async ev=>{
 ev.preventDefault();const f=ev.currentTarget,b=f.querySelector('button');b.disabled=true;
 const d=Object.fromEntries(new FormData(f));
 try{await request(api.leads,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});f.reset();message('Prospect ajouté.');await loadLeads()}
 catch(e){message(e.message,true)}finally{b.disabled=false}
});
$('#payment-form').addEventListener('submit',async ev=>{
 ev.preventDefault();const f=ev.currentTarget,b=f.querySelector('button');b.disabled=true;
 const raw=Object.fromEntries(new FormData(f));
 const payload={reference:raw.reference,name:raw.name,email:raw.email,description:raw.description,kind:raw.kind,amount_cents:Math.round(Number(raw.amount)*100)};
 try{const out=await request(api.payments,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 message('Lien Stripe créé. Vous pouvez le copier dans la liste ci-dessous.');f.reset();await loadPayments()}
 catch(e){message(e.message,true)}finally{b.disabled=false}
});
renderTemplates();loadLeads().catch(e=>message(e.message,true));loadPayments().catch(e=>message(e.message,true));
})();