// gallery-lightbox.js — lightweight accessible lightbox for profile gallery
(function(){
  function qs(el, sel){ return (sel ? el.querySelector(sel) : document.querySelector(el)); }

  function createLightbox(){
    let existing = document.querySelector('.lightbox');
    if(existing) return existing;
    const lb = document.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('aria-hidden','true'); lb.setAttribute('role','dialog'); lb.setAttribute('aria-modal','true');
    lb.innerHTML = `
      <button class="lb-close" aria-label="Close lightbox">✕</button>
      <div class="lb-dialog">
        <img src="" alt="" />
        <div class="lb-controls">
          <div>
            <button class="lb-btn lb-prev" aria-label="Previous">← Prev</button>
            <button class="lb-btn lb-play" aria-pressed="false" aria-label="Start slideshow">Play</button>
            <button class="lb-btn lb-next" aria-label="Next">Next →</button>
          </div>
          <div class="lb-caption" aria-live="polite"></div>
          <div class="lb-indicator" aria-live="polite"> </div>
          <div class="options sr-only" aria-hidden="false">
            <label for="lb-speed">Speed</label>
            <select id="lb-speed" aria-label="Slideshow speed">
              <option value="4000">Slow</option>
              <option value="3000" selected>Normal</option>
              <option value="2000">Fast</option>
            </select>
            <label for="lb-autostart">Auto-start</label>
            <input id="lb-autostart" type="checkbox" aria-label="Auto start slideshow">
          </div>
        </div>
        <div class="lb-thumbs" aria-hidden="false" role="list"></div>
        <div class="lb-announcer sr-only" aria-live="polite" aria-atomic="true"></div>
      </div>
    `;
    document.body.appendChild(lb);
    return lb;
  }

  function openLightbox(lb, imgs, index){
    const img = imgs[index];
    const lbImg = lb.querySelector('img');
    // crossfade: hide, set src, show when loaded
    lbImg.classList.add('loading');
    lbImg.style.opacity = '0';
    lbImg.onload = function(){ lbImg.classList.remove('loading'); lbImg.style.transition = 'opacity .28s ease'; lbImg.style.opacity = '1'; lbImg.onload = null; };
    lbImg.src = img.src;
    lbImg.alt = img.alt || '';
    lb.querySelector('.lb-caption').textContent = img.alt || '';
    lb.dataset.index = index;
    lb.setAttribute('aria-hidden','false');
    // manage focus
    lb._prevActive = document.activeElement;
    lb.querySelector('.lb-close').focus();
  }

  function closeLightbox(lb){
    lb.setAttribute('aria-hidden','true');
    const prev = lb._prevActive; if(prev && prev.focus) prev.focus();
  }

  function bind(imgEls){
    if(!imgEls.length) return;
    const lb = createLightbox();
    const closeBtn = lb.querySelector('.lb-close');
    const prevBtn = lb.querySelector('.lb-prev');
    const nextBtn = lb.querySelector('.lb-next');
    const thumbContainer = lb.querySelector('.lb-thumbs');

    // rebuild thumbnails
    thumbContainer.innerHTML = '';
    imgEls.forEach((img, idx) => {
      const b = document.createElement('button'); b.setAttribute('role','listitem');
      const t = document.createElement('img'); t.src = img.src; t.alt = img.alt || '';
      b.appendChild(t);
      b.addEventListener('click', ()=>{ stopAutoplay(); openLightbox(lb, imgEls, idx); });
      thumbContainer.appendChild(b);
    });

    imgEls.forEach((img, i) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', ()=> openLightbox(lb, imgEls, i));
      img.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(lb, imgEls, i); } });
      img.setAttribute('tabindex', '0');
    });

    function markActive(index){
      const nodes = Array.from(thumbContainer.children);
      nodes.forEach((n,i)=> n.classList.toggle('active', i === index));
      // ensure active thumb visible
      const active = nodes[index]; if(active) active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    }

    closeBtn.addEventListener('click', ()=> { stopAutoplay(); closeLightbox(lb); });
    prevBtn.addEventListener('click', (e)=>{
      const idx = Number(lb.dataset.index || 0);
      openLightbox(lb, imgEls, (idx -1 + imgEls.length) % imgEls.length);
      // only stop autoplay for real user interactions
      if (e && e.isTrusted) stopAutoplay();
    });
    nextBtn.addEventListener('click', (e)=>{
      const idx = Number(lb.dataset.index || 0);
      openLightbox(lb, imgEls, (idx +1) % imgEls.length);
      // only stop autoplay for real user interactions
      if (e && e.isTrusted) stopAutoplay();
    });

    const playBtn = lb.querySelector('.lb-play');
    const speedSelect = lb.querySelector('#lb-speed');
    const autoStartCheck = lb.querySelector('#lb-autostart');
    const announcer = lb.querySelector('.lb-announcer');

    function startAutoplay(){
      if(lb._playId) return;
      playBtn.textContent = 'Pause';
      playBtn.setAttribute('aria-pressed','true');
      playBtn.setAttribute('aria-label','Pause slideshow');
      const ms = Number(speedSelect.value) || 3000;
      lb._playId = setInterval(()=>{ nextBtn.click(); }, ms);
      announcer.textContent = 'Slideshow started';
    }
    function stopAutoplay(){
      if(lb._playId){ clearInterval(lb._playId); lb._playId = null; }
      playBtn.textContent = 'Play';
      playBtn.setAttribute('aria-pressed','false');
      playBtn.setAttribute('aria-label','Start slideshow');
      announcer.textContent = 'Slideshow stopped';
    }
    // respond to speed changes
    speedSelect.addEventListener('change', ()=>{
      if(lb._playId){ stopAutoplay(); startAutoplay(); }
    });
    // auto-start preference
    autoStartCheck.addEventListener('change', ()=>{ lb._autoStart = !!autoStartCheck.checked; });
    playBtn.addEventListener('click', ()=>{
      if(playBtn.getAttribute('aria-pressed') === 'true'){ stopAutoplay(); } else { startAutoplay(); }
    });

    // close when clicking outside dialog
    lb.addEventListener('click', (e)=>{ if(e.target === lb) { stopAutoplay(); closeLightbox(lb); } });

    // when open, update thumbnails active; override openLightbox to mark
    const _open = openLightbox;
    openLightbox = function(lbRef, imgsRef, indexRef){
      _open(lbRef, imgsRef, indexRef);
      markActive(Number(indexRef));
      const total = imgsRef.length || 0;
      const indicator = lb.querySelector('.lb-indicator');
      if(indicator) indicator.textContent = `${Number(indexRef) + 1} / ${total}`;
      if(announcer) announcer.textContent = `Image ${Number(indexRef) + 1} of ${total}`;
      // resume autoplay automatically if auto-start is enabled or if play was pressed
      if(lb._autoStart || playBtn.getAttribute('aria-pressed') === 'true') startAutoplay();
      // trap focus inside modal
      trapFocus(lb);
    };

    // keyboard and focus trap
    if(!lb._keydownBound){
      lb._keydownBound = true;
      const handler = (e) => {
        if(lb.getAttribute('aria-hidden') === 'false'){
          if(e.key === 'Escape'){ stopAutoplay(); closeLightbox(lb); }
          if(e.key === 'ArrowLeft') { prevBtn.click(); if (e.isTrusted) stopAutoplay(); }
          if(e.key === 'ArrowRight') { nextBtn.click(); if (e.isTrusted) stopAutoplay(); }
        }
      };
      document.addEventListener('keydown', handler);
    }

    function trapFocus(modal){
      if(modal._trapBound) return;
      modal._trapBound = true;
      const focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const nodes = Array.from(modal.querySelectorAll(focusable)).filter(n=>!n.hasAttribute('disabled'));
      const first = nodes[0]; const last = nodes[nodes.length -1];
      modal.addEventListener('keydown', (e)=>{
        if(e.key !== 'Tab') return;
        if(e.shiftKey){ if(document.activeElement === first){ e.preventDefault(); last.focus(); } }
        else{ if(document.activeElement === last){ e.preventDefault(); first.focus(); } }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const imgs = Array.from(document.querySelectorAll('.galleries .gallery img'));
    if(imgs.length) bind(imgs);
  });

  // when profile page populates gallery asynchronously, re-bind
  document.addEventListener('gallery:updated', ()=>{
    const imgs = Array.from(document.querySelectorAll('.galleries .gallery img'));
    if(imgs.length) bind(imgs);
  });

})();
