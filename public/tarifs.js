(()=>{
  const $=selector=>document.querySelector(selector);
  const fmt=n=>new Intl.NumberFormat('fr-FR').format(n)+' € HT';
  const siteNames={790:'Essentiel',1490:'Business',2490:'Signature'};
  const shopNames={1990:'Start',3490:'Business',5990:'Signature'};
  const subNames={0:'Sans abonnement',49:'Suivi',99:'Sérénité'};
  const value=name=>Number(document.querySelector('input[name="'+name+'"]:checked')?.value||0);
  const select=(name,value)=>{const item=document.querySelector('input[name="'+name+'"][value="'+value+'"]');if(item)item.checked=true;};
  function update(){
    const kind=document.querySelector('input[name="project-kind"]:checked')?.value||'site';
    const shop=kind==='shop';
    $('#site-formulas').hidden=shop;
    $('#shop-formulas').hidden=!shop;
    const price=value(shop?'shop-site':'site-plan');
    const label=(shop?shopNames:siteNames)[price];
    const subscription=value('subscription-plan');
    const seo=$('#seo-active').checked?390:0;
    const total=subscription+seo;
    $('#identity-combination').textContent=(shop?'E-commerce ':'Site vitrine ')+label+(subscription?' + '+subNames[subscription]:'')+(seo?' + SEO':'');
    $('#identity-once').textContent='Dès '+fmt(price);
    $('#identity-recurring').textContent=fmt(subscription)+'/mois';
    $('#identity-seo-cost').textContent=fmt(seo)+'/mois';
    $('#identity-monthly').textContent=fmt(total)+'/mois';
    $('#identity-due').textContent='Dès '+fmt(price+total);
    $('#identity-then-month').textContent=fmt(total)+'/mois';
    document.querySelector('.identity-then').hidden=total===0;
    const qs=new URLSearchParams({projet:shop?'ecommerce':'site-vitrine',creation:label,abonnement:subNames[subscription],seo:seo?'SEO actif 390 EUR/mois':'Non',estimation_creation:'A partir de '+price+' EUR HT',estimation_mensuelle:total+' EUR HT/mois'});
    $('#identity-quote').href='/contact.html?'+qs.toString();
  }
  document.querySelectorAll('input[name="project-kind"],input[name="site-plan"],input[name="shop-site"],input[name="subscription-plan"],#seo-active').forEach(x=>x.addEventListener('change',update));
  document.querySelectorAll('[data-site],[data-shop-site],[data-sub],[data-seo]').forEach(button=>button.addEventListener('click',event=>{
    event.preventDefault();
    if(button.hasAttribute('data-site')){select('project-kind','site');select('site-plan',button.dataset.site);}
    if(button.hasAttribute('data-shop-site')){select('project-kind','shop');select('shop-site',button.dataset.shopSite);}
    if(button.hasAttribute('data-sub'))select('subscription-plan',button.dataset.sub);
    if(button.hasAttribute('data-seo'))$('#seo-active').checked=true;
    update();
    $('#simulateur').scrollIntoView({behavior:'smooth',block:'start'});
  }));
  update();
})();