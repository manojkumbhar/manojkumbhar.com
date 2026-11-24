
(function(){
  var root=document.documentElement,body=document.body;
  document.getElementById('theme').addEventListener('click',function(){
    var t=root.dataset.theme==='dark'?'light':'dark';root.dataset.theme=t;
    try{localStorage.setItem(document.documentElement.dataset.themeKey||'site-theme',t);}catch(e){}
  });
  document.querySelectorAll('.yr').forEach(function(e){e.textContent=new Date().getFullYear();});

  // mobile sidebar
  var btn=document.getElementById('menuBtn'),scrim=document.getElementById('scrim');
  function setNav(o){body.classList.toggle('nav-open',o);btn.setAttribute('aria-expanded',o?'true':'false');}
  btn.addEventListener('click',function(){setNav(!body.classList.contains('nav-open'));});
  scrim.addEventListener('click',function(){setNav(false);});
  document.querySelectorAll('.side nav a').forEach(function(a){a.addEventListener('click',function(){setNav(false);});});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')setNav(false);});

  // active section in sidebar
  var links=[].slice.call(document.querySelectorAll('.side nav a'));
  var ids=['now','notes','projects','about','beyond','experience','contact'];
  if('IntersectionObserver' in window){
    var so=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){links.forEach(function(l){l.classList.toggle('active',l.getAttribute('href')==='#'+e.target.id);});}});},{rootMargin:'-45% 0px -50% 0px'});
    ids.forEach(function(id){var el=document.getElementById(id);if(el)so.observe(el);});
  }

  // Trip slideshow (max 5; driven by assets/trips/trips.json)
  (function(){
    var root=document.getElementById('tripShow');
    if(!root)return;
    var MAX=5, IMAGE_MS=5000, BASE='assets/trips/';
    var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var track=root.querySelector('.ss-track');
    var captionEl=root.querySelector('.ss-caption');
    var dotsEl=root.querySelector('.ss-dots');
    var prevBtn=root.querySelector('.ss-prev');
    var nextBtn=root.querySelector('.ss-next');
    var barStatus=document.getElementById('tripBar');
    var trips=[], index=0, timer=null, hoverPause=false, pageHidden=false;

    function asset(file){return BASE+file;}
    function isPaused(){return hoverPause||pageHidden;}

    fetch(BASE+'trips.json').then(function(r){return r.ok?r.json():Promise.reject();}).then(init).catch(function(){});

    function init(data){
      if(!Array.isArray(data))return;
      trips=data.slice(0,MAX);
      if(!trips.length)return;
      render();
      go(0);
      bindNav();
    }

    function render(){
      track.innerHTML='';
      dotsEl.innerHTML='';
      trips.forEach(function(t,i){
        var slide=document.createElement('div');
        slide.className='slide'+(i===0?' is-active':'');
        slide.setAttribute('role','group');
        slide.setAttribute('aria-roledescription','slide');
        slide.setAttribute('aria-label',(i+1)+' of '+trips.length);
        slide.setAttribute('aria-hidden',i===0?'false':'true');

        var media;
        if(t.type==='video'){
          media=document.createElement('video');
          media.setAttribute('playsinline','');
          media.setAttribute('webkit-playsinline','');
          media.muted=true;
          media.defaultMuted=true;
          media.setAttribute('muted','');
          media.preload=i===0?'metadata':'none';
          if(t.poster) media.setAttribute('poster',asset(t.poster));
          media.setAttribute('aria-label',t.alt||t.caption||'Trip video');
          if(i===0) appendSources(media,t);
          else{
            if(t.srcWebm) media.dataset.srcWebm=asset(t.srcWebm);
            media.dataset.src=asset(t.src);
          }
          media.addEventListener('ended',function(){
            if(!reduce && !isPaused()) go(index+1);
          });
        }else{
          media=document.createElement('img');
          media.alt=t.alt||t.caption||'';
          media.width=900; media.height=1600;
          if(i===0){
            media.src=asset(t.src);
            media.setAttribute('fetchpriority','high');
          }else{
            media.loading='lazy';
            media.dataset.src=asset(t.src);
          }
        }
        if(t.objectPosition) media.style.objectPosition=t.objectPosition;
        slide.appendChild(media);
        track.appendChild(slide);

        var dot=document.createElement('button');
        dot.type='button';
        dot.className='ss-dot';
        dot.setAttribute('role','tab');
        dot.setAttribute('aria-label','Show photo '+(i+1)+(t.caption?': '+t.caption:''));
        if(i===0) dot.setAttribute('aria-current','true');
        dot.addEventListener('click',function(){go(i);});
        dotsEl.appendChild(dot);
      });
      root.classList.toggle('has-many', trips.length>1);
    }

    function appendSources(video,t){
      if(t.srcWebm){
        var s1=document.createElement('source');
        s1.src=asset(t.srcWebm); s1.type='video/webm';
        video.appendChild(s1);
      }
      var s2=document.createElement('source');
      s2.src=asset(t.src); s2.type='video/mp4';
      video.appendChild(s2);
    }

    function loadMedia(i){
      var slide=track.children[i]; if(!slide)return;
      var media=slide.querySelector('img,video'); if(!media)return;
      if(media.tagName==='IMG' && media.dataset.src){
        media.src=media.dataset.src;
        delete media.dataset.src;
      }
      if(media.tagName==='VIDEO' && media.dataset.src){
        if(media.dataset.srcWebm){
          var s1=document.createElement('source');
          s1.src=media.dataset.srcWebm; s1.type='video/webm';
          media.appendChild(s1);
          delete media.dataset.srcWebm;
        }
        var s2=document.createElement('source');
        s2.src=media.dataset.src; s2.type='video/mp4';
        media.appendChild(s2);
        delete media.dataset.src;
        media.preload='metadata';
        media.load();
      }
    }

    function stopVideo(el){
      if(!el)return;
      el.pause();
      try{el.currentTime=0;}catch(e){}
    }

    function go(n){
      if(!trips.length)return;
      var len=trips.length;
      n=((n%len)+len)%len;
      var prev=track.children[index];
      if(prev && n!==index) stopVideo(prev.querySelector('video'));
      index=n;
      loadMedia(index);
      if(len>1) loadMedia((index+1)%len);
      [].forEach.call(track.children,function(sl,i){
        sl.classList.toggle('is-active',i===index);
        sl.setAttribute('aria-hidden',i===index?'false':'true');
      });
      [].forEach.call(dotsEl.children,function(d,i){
        if(i===index) d.setAttribute('aria-current','true');
        else d.removeAttribute('aria-current');
      });
      var t=trips[index];
      if(captionEl) captionEl.textContent=t.caption||'';
      if(barStatus) barStatus.textContent='● '+(t.caption||t.trip||'');
      playActive();
      schedule();
    }

    function playActive(){
      var vid=track.children[index] && track.children[index].querySelector('video');
      if(!vid || reduce || isPaused()) return;
      var p=vid.play();
      if(p && p.catch) p.catch(function(){});
    }

    function schedule(){
      if(timer){clearTimeout(timer);timer=null;}
      if(reduce || isPaused() || trips.length<2) return;
      var t=trips[index];
      if(t.type==='video'){
        var vid=track.children[index].querySelector('video');
        var ms=10000;
        if(vid && isFinite(vid.duration) && vid.duration>0) ms=Math.ceil(vid.duration*1000)+400;
        else if(vid) vid.addEventListener('loadedmetadata',function once(){
          vid.removeEventListener('loadedmetadata',once);
          if(trips[index].type==='video' && !isPaused() && !reduce){
            if(timer) clearTimeout(timer);
            timer=setTimeout(function(){go(index+1);},Math.ceil(vid.duration*1000)+400);
          }
        });
        timer=setTimeout(function(){go(index+1);},ms);
      }else{
        timer=setTimeout(function(){go(index+1);},IMAGE_MS);
      }
    }

    function syncPause(){
      var vid=track.querySelector('.slide.is-active video');
      if(isPaused()){
        if(timer){clearTimeout(timer);timer=null;}
        if(vid) vid.pause();
      }else{
        playActive();
        schedule();
      }
    }

    function bindNav(){
      if(prevBtn) prevBtn.addEventListener('click',function(){go(index-1);});
      if(nextBtn) nextBtn.addEventListener('click',function(){go(index+1);});
      root.addEventListener('mouseenter',function(){hoverPause=true;syncPause();});
      root.addEventListener('mouseleave',function(){hoverPause=false;syncPause();});
      root.addEventListener('focusin',function(){hoverPause=true;syncPause();});
      root.addEventListener('focusout',function(e){
        if(!root.contains(e.relatedTarget)){hoverPause=false;syncPause();}
      });
      root.addEventListener('keydown',function(e){
        if(e.key==='ArrowLeft'){e.preventDefault();go(index-1);}
        else if(e.key==='ArrowRight'){e.preventDefault();go(index+1);}
        else if(e.key==='Home'){e.preventDefault();go(0);}
        else if(e.key==='End'){e.preventDefault();go(trips.length-1);}
      });
      document.addEventListener('visibilitychange',function(){pageHidden=document.hidden;syncPause();});
    }
  })();

  // Carryover widget. Present only when a project sets demo.type to "carryover".
  var stepBtn=document.getElementById('step');
  if(stepBtn){
  var a,b,stepN=0;var $=function(id){return document.getElementById(id);};
  function newSum(){
    do{a=10+Math.floor(Math.random()*40);b=10+Math.floor(Math.random()*40);}while((a%10)+(b%10)<10||a+b>99);
    $('a1').textContent=Math.floor(a/10);$('a0').textContent=a%10;$('b1').textContent=Math.floor(b/10);$('b0').textContent=b%10;
    $('r1').textContent='?';$('r0').textContent='?';$('cTens').classList.remove('show');stepN=0;
    $('explain').textContent='Add the ones first. What happens when they make more than 9?';$('step').textContent='Next step';
  }
  stepBtn.addEventListener('click',function(){
    var o=(a%10)+(b%10),t=Math.floor(a/10)+Math.floor(b/10)+1;
    if(stepN===0){$('r0').textContent=o%10;$('cTens').classList.add('show');$('explain').textContent=(a%10)+' + '+(b%10)+' = '+o+'. Keep '+(o%10)+' in the ones, carry 1 ten over to the tens.';stepN=1;}
    else if(stepN===1){$('r1').textContent=t;$('explain').textContent='Tens: '+Math.floor(a/10)+' + '+Math.floor(b/10)+' + the carried 1 = '+t+'. So '+a+' + '+b+' = '+(a+b)+'.';$('step').textContent='Again';stepN=2;}
    else newSum();
  });
  document.getElementById('newsum').addEventListener('click',newSum);
  newSum();
  }

  // reveal on scroll
  var els=document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(function(e){e.classList.add('in')});return;}
  var io=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}})},{threshold:.12,rootMargin:'0px 0px -40px 0px'});
  els.forEach(function(e){io.observe(e)});
})();
