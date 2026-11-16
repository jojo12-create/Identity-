/* IDENTITY / showcase — the gallery rotates only while visible, pauses for user control. */
(()=> {
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 document.querySelectorAll('.project-grid:has(.showcase-card)').forEach(track=>{
  const slides=Array.from(track.querySelectorAll('.showcase-card'));
  if(!slides.length)return;
  let current=0, visible=false, hovering=false, pausedUntil=0, interval;
  const counter=track.parentElement.querySelector('.carousel-count');
  const controls=track.parentElement.querySelector('.carousel-controls');
  const count=i=>String(i+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
  function mark(i){
    current=i;slides.forEach((el,k)=>el.classList.toggle('is-playing',k===i&&visible&&!reduced));
    if(counter)counter.textContent=count(i);
  }
  function activeIndex(){
    const left=track.scrollLeft;
    return slides.reduce((best,el,i)=>Math.abs(el.offsetLeft-slides[0].offsetLeft-left)<Math.abs(slides[best].offsetLeft-slides[0].offsetLeft-left)?i:best,0)
  }
  const travel=i=>{
    const n=(i+slides.length)%slides.length;
    track.scrollTo({left:slides[n].offsetLeft-slides[0].offsetLeft,behavior:reduced?'instant':'smooth'});
    mark(n);
  };
  function tick(){if(!visible||hovering||document.hidden||reduced||Date.now()<pausedUntil)return;travel(current+1)}
  function postpone(){pausedUntil=Date.now()+14000;}
  if(controls){
    controls.querySelector('.prev')?.addEventListener('click',postpone);
    controls.querySelector('.next')?.addEventListener('click',postpone);
  }
  track.addEventListener('pointerdown',postpone,{passive:true});
  track.addEventListener('touchstart',postpone,{passive:true});
  track.addEventListener('mouseenter',()=>{hovering=true;});track.addEventListener('mouseleave',()=>{hovering=false;});
  track.addEventListener('focusin',postpone);
  let raf=0;
  track.addEventListener('scroll',()=>{
    cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>mark(activeIndex()));
  },{passive:true});
  if('IntersectionObserver' in window){
    new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting||false;mark(activeIndex());},{threshold:.18}).observe(track);
  }else{visible=true}
  if(!reduced)interval=setInterval(tick,8200);
  mark(0);
 });
})();