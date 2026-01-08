// marketplace.js — fetches tailors.json and renders listing cards
async function loadListings(){
  try{
    const res = await fetch('./data/tailors.json');
    const tailors = await res.json();
    const container = document.querySelector('.listings');
    container.innerHTML = '';
    tailors.forEach(t => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <img src="${t.profile_image}" alt="${t.name}" loading="lazy" width="300" height="300">
        <h3>${t.name}</h3>
        <p class="muted small">${t.services.join(' · ')} · ${t.rating} ★</p>
        <div class="card-actions">
          <a class="btn-primary" href="profile-display.html?id=${encodeURIComponent(t.id)}">View profile</a>
          <a class="btn-outline" href="order-form.html?tailor=${encodeURIComponent(t.id)}">Order</a>
        </div>
      `;
      container.appendChild(card);
    });
  }catch(err){
    console.error('Failed to load listings', err);
  }
}

document.addEventListener('DOMContentLoaded', loadListings);
