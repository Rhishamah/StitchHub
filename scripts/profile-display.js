// profile-display.js — populate profile page based on ?id=...
function qsParam(name){
  return new URLSearchParams(window.location.search).get(name);
}

async function loadProfile(){
  const id = qsParam('id');
  if(!id){ document.getElementById('t-name').textContent = 'Tailor not specified'; return; }
  try{
    const res = await fetch('./data/tailors.json');
    const tailors = await res.json();
    const t = tailors.find(x => x.id === id);
    if(!t){ document.getElementById('t-name').textContent = 'Not found'; return; }
    document.getElementById('t-name').textContent = t.name;
    document.getElementById('t-meta').textContent = `${t.services.join(' · ')} · ${t.rating} ★`;
    document.getElementById('t-desc').textContent = t.description;
    document.getElementById('t-profile-img').src = t.profile_image;
    document.getElementById('t-order').href = `order-form.html?tailor=${encodeURIComponent(t.id)}`;
    const gallery = document.getElementById('t-portfolio');
    gallery.innerHTML = '';
    gallery.setAttribute('role', 'list');
    t.images.forEach((src, idx) => {
      const div = document.createElement('div');
      div.className = 'gallery';
      div.setAttribute('role', 'listitem');
      const img = document.createElement('img');
      img.src = src;
      img.loading = 'lazy';
      img.alt = `${t.name} — portfolio image ${idx + 1}`;
      img.tabIndex = 0; // keyboard focusable
      img.setAttribute('aria-label', `Open ${t.name} image ${idx + 1}`);
      div.appendChild(img);
      gallery.appendChild(div);
    });
    // notify other scripts (lightbox) that gallery images were updated
    document.dispatchEvent(new Event('gallery:updated'));
  }catch(e){ console.error(e); }
}

document.addEventListener('DOMContentLoaded', loadProfile);
