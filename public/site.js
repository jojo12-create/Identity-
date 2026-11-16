const menuButton=document.querySelector('#menu-toggle'),navigation=document.querySelector('#menu-links');if(menuButton&&navigation){menuButton.addEventListener('click',()=>{const open=navigation.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Fermer le menu':'Ouvrir le menu');menuButton.textContent=open?'×':'☰'});navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{navigation.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.textContent='☰'}))}
document.querySelectorAll('.project-grid').forEach(track => {
  const cards=[...track.querySelectorAll('.project-card')];
  if(!cards.length)return;
  track.setAttribute('role','region');
  track.setAttribute('tabindex','0');
  track.setAttribute('aria-roledescription','carrousel');
  track.setAttribute('aria-label','Captures de navigation de projets Identity');
  const controls=document.createElement('div');
  controls.className='carousel-controls';
  controls.innerHTML='<span class="carousel-count" aria-live="polite">01 / 04</span><div class="carousel-buttons"><button type="button" class="carousel-arrow prev" aria-label="Projet précédent">←</button><button type="button" class="carousel-arrow next" aria-label="Projet suivant">→</button></div>';
  track.insertAdjacentElement('afterend',controls);
  const hint=document.createElement('p');
  hint.className='carousel-hint';
  hint.textContent='Faites défiler pour explorer les démonstrations';
  controls.insertAdjacentElement('afterend',hint);
  const count=controls.querySelector('.carousel-count');
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active=0,visible=false,hovered=false,focused=false,pointerDown=false,pausedByUser=false,requestedPlay=false,timer=null,scrollTimer=null;
  const videoOf=i=>cards[i]?.querySelector('.project-video');
  function updatePlayback(){
    cards.forEach((card,i)=>{
      const video=videoOf(i),toggle=card.querySelector('.project-motion__toggle');
      if(!video)return;
      const playing=i===active&&visible&&!document.hidden&&!pausedByUser&&(!reduce||requestedPlay);
      if(playing){
        if(video.paused){const promise=video.play();if(promise&&promise.catch)promise.catch(()=>{card.classList.remove('is-playing');if(toggle)toggle.textContent='▶'})}
        card.classList.add('is-playing');
      } else {
        if(!video.paused)video.pause();
        card.classList.remove('is-playing');
        if(i!==active&&video.readyState>0){try{video.currentTime=0}catch(e){}}
      }
      if(toggle){toggle.textContent=playing?'Ⅱ':'▶';toggle.setAttribute('aria-label',playing?'Mettre en pause la démonstration':'Lire la démonstration')}
    })
  }
  function updateCount(){count.textContent=String(active+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0')}
  function stopTimer(){window.clearTimeout(timer);timer=null}
  function schedule(){
    stopTimer();
    if(!visible||hovered||focused||pointerDown||reduce||document.hidden||pausedByUser)return;
    const video=videoOf(active);
    const remaining=video&&Number.isFinite(video.duration)&&video.duration>0?Math.max(850,(video.duration-video.currentTime)*1000+650):17000;
    timer=window.setTimeout(()=>slideTo(active+1),remaining);
  }
  function slideTo(next,manual=false){
    active=(next+cards.length)%cards.length;
    pausedByUser=false;requestedPlay=false;
    updateCount();updatePlayback();
    track.scrollTo({left:cards[active].offsetLeft-cards[0].offsetLeft,behavior:reduce?'auto':'smooth'});
    schedule()
  }
  controls.querySelector('.prev').addEventListener('click',()=>slideTo(active-1,true));
  controls.querySelector('.next').addEventListener('click',()=>slideTo(active+1,true));
  cards.forEach((card,i)=>{
    const video=videoOf(i),progress=card.querySelector('.project-motion__timeline > span');
    video?.addEventListener('loadedmetadata',()=>{if(i===active)schedule()});
    video?.addEventListener('timeupdate',()=>{if(progress&&Number.isFinite(video.duration)&&video.duration>0)progress.style.width=(Math.min(100,Math.max(0,100*video.currentTime/video.duration))).toFixed(2)+'%'});
    video?.addEventListener('ended',()=>{if(i===active&&visible&&!hovered&&!focused&&!pointerDown&&!reduce&&!document.hidden&&!pausedByUser)slideTo(active+1);else schedule()});
    card.querySelector('.project-replay')?.addEventListener('click',()=>{
      if(active!==i)slideTo(i,true);
      const v=videoOf(i);if(!v)return;
      pausedByUser=false;requestedPlay=true;
      try{v.currentTime=0}catch(e){}
      updatePlayback();schedule()
    });
    card.querySelector('.project-motion__toggle')?.addEventListener('click',()=>{
      if(active!==i){slideTo(i,true);requestedPlay=true;updatePlayback();return}
      pausedByUser=!pausedByUser;requestedPlay=!pausedByUser;
      updatePlayback();schedule()
    });
  });
  track.addEventListener('scroll',()=>{
    window.clearTimeout(scrollTimer);
    scrollTimer=window.setTimeout(()=>{
      let nearest=active,min=Infinity;
      cards.forEach((card,i)=>{const d=Math.abs(card.offsetLeft-cards[0].offsetLeft-track.scrollLeft);if(d<min){min=d;nearest=i}});
      if(nearest!==active){active=nearest;pausedByUser=false;requestedPlay=false;updateCount();updatePlayback()}
      schedule();
    },130);
  },{passive:true});
  track.addEventListener('mouseenter',()=>{hovered=true;stopTimer()});
  track.addEventListener('mouseleave',()=>{hovered=false;schedule()});
  track.addEventListener('focusin',()=>{focused=true;stopTimer()});
  track.addEventListener('focusout',e=>{if(!track.contains(e.relatedTarget)){focused=false;schedule()}});
  track.addEventListener('pointerdown',()=>{pointerDown=true;stopTimer()},{passive:true});
  window.addEventListener('pointerup',()=>{if(pointerDown){pointerDown=false;schedule()}},{passive:true});
  track.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();slideTo(active+1,true)}if(e.key==='ArrowLeft'){e.preventDefault();slideTo(active-1,true)}});
  document.addEventListener('visibilitychange',()=>{updatePlayback();schedule()});
  window.addEventListener('resize',()=>{track.scrollLeft=cards[active].offsetLeft-cards[0].offsetLeft});
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      visible=entries[0]?.intersectionRatio>=.16;
      updatePlayback();schedule();
    },{threshold:[0,.16,.45]});
    observer.observe(track)
  }else{visible=true;updatePlayback();schedule()}
  updateCount();updatePlayback();
});
const form=document.querySelector('#contact-form');if(form){form.addEventListener('submit',async event=>{event.preventDefault();const button=form.querySelector('[type="submit"]');const note=form.querySelector('.form-note');button.disabled=true;button.textContent='Envoi en cours…';try{const r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form)))});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||"L'envoi a échoué.");form.reset();note.textContent='Votre demande a bien été reçue. Identity reviendra vers vous.';button.textContent='Demande reçue ✓';}catch(e){note.textContent=e.message||"Une erreur est survenue. Merci de réessayer.";button.disabled=false;button.textContent='Envoyer mon message →';}})}
/* Real project recordings inside the hero laptop — one video active at a time. */
(function(){
  const root=document.querySelector('.laptop-carousel');
  if(!root)return;
  const slides=[...root.querySelectorAll('.laptop-slide')];
  if(!slides.length)return;
  const counter=root.querySelector('.laptop-progress');
  const reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  let index=0,visible=true,manualPause=false,endTimer=null;
  const videos=slides.map(slide=>slide.querySelector('.laptop-project-video'));
  function cancelNext(){window.clearTimeout(endTimer);endTimer=null}
  function paintProgress(i){
    const v=videos[i],bar=slides[i].querySelector('.laptop-video-progress span');
    if(v&&bar&&Number.isFinite(v.duration)&&v.duration>0)
      bar.style.width=(100*Math.min(1,v.currentTime/v.duration)).toFixed(2)+'%';
  }
  function display(i){
    cancelNext();index=(i+slides.length)%slides.length;manualPause=false;
    slides.forEach((slide,j)=>{
      const selected=j===index;
      slide.classList.toggle('is-active',selected);
      slide.setAttribute('aria-hidden',String(!selected));
      const v=videos[j];
      if(!v)return;
      if(!selected){
        v.pause();try{v.currentTime=0}catch(e){}
        paintProgress(j);
      } else {
        v.preload='auto';
        if(v.readyState===0)v.load();
        try{v.currentTime=0}catch(e){}
      }
    });
    if(counter)counter.textContent=String(index+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
    // Précharger la prochaine séquence avant la transition, sans lancer plusieurs vidéos.
    const upcoming=videos[(index+1)%videos.length];
    if(upcoming&&upcoming.readyState<3){upcoming.preload='auto';if(upcoming.networkState===0||upcoming.networkState===3)upcoming.load()}
    sync();
  }
  function sync(){
    const v=videos[index];if(!v)return;
    if(document.hidden||!visible||manualPause||reduce){v.pause();return}
    const promise=v.play();
    if(promise&&promise.catch)promise.catch(()=>{});
  }
  videos.forEach((v,i)=>{
    if(!v)return;
    v.addEventListener('timeupdate',()=>paintProgress(i));
    v.addEventListener('ended',()=>{
      if(i!==index)return;
      paintProgress(i);cancelNext();
      if(!visible||document.hidden||manualPause||reduce)return;
      endTimer=window.setTimeout(()=>display(index+1),750);
    });
    v.addEventListener('click',()=>{
      if(i!==index)return;
      manualPause=!v.paused;
      if(manualPause)v.pause();else{manualPause=false;sync()}
    });
    v.addEventListener('error',()=>{
      if(i===index&&!reduce)endTimer=window.setTimeout(()=>display(index+1),2800);
    });
  });
  root.querySelector('.laptop-prev')?.addEventListener('click',()=>display(index-1));
  root.querySelector('.laptop-next')?.addEventListener('click',()=>display(index+1));
  root.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'){e.preventDefault();display(index+1)}
    if(e.key==='ArrowLeft'){e.preventDefault();display(index-1)}
  });
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      visible=(entries[0]?.intersectionRatio||0)>.12;
      sync();
    },{threshold:[0,.12,.5]});
    observer.observe(root);
  }
  document.addEventListener('visibilitychange',sync);
  display(0);
})();