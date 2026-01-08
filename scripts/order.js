// order.js — populate tailor select and pre-fill from ?tailor=ID
function getQueryParam(name){
  return new URLSearchParams(window.location.search).get(name);
}

async function initOrderForm(){
  const sel = document.getElementById('tailor');
  if(!sel) return;
  try{
    const res = await fetch('./data/tailors.json');
    const tailors = await res.json();
    tailors.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id; opt.textContent = `${t.name} — ${t.services.join(', ')}`;
      sel.appendChild(opt);
    });
    const q = getQueryParam('tailor');
    if(q){ sel.value = q; }
    // set initial summary
    updateSummary();
    // update summary when select or service/date changes
    sel.addEventListener('change', updateSummary);
    document.getElementById('service').addEventListener('change', updateSummary);
    document.getElementById('date').addEventListener('change', updateSummary);
    // form submit handling
    const form = document.getElementById('orderForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if(!form.checkValidity()){ form.reportValidity(); return; }
      // simulate submission
      const orderSuccess = document.getElementById('orderSuccess');
      orderSuccess.style.display = 'block';
      orderSuccess.focus();
      // clear after delay
      setTimeout(()=>{ document.getElementById('orderSuccess').style.display = 'none'; form.reset(); updateSummary(); }, 2500);
    });
  }catch(e){ console.error('Failed to load tailors for order form', e); }
}

document.addEventListener('DOMContentLoaded', initOrderForm);

function updateSummary(){
  const sTailor = document.getElementById('s-tailor');
  const sService = document.getElementById('s-service');
  const sDate = document.getElementById('s-date');
  const sTotal = document.getElementById('s-total');
  const sel = document.getElementById('tailor');
  const service = document.getElementById('service');
  const date = document.getElementById('date');
  if(sel && sel.value){ sTailor.textContent = sel.options[sel.selectedIndex].text; } else { sTailor.textContent = '—'; }
  sService.textContent = service && service.value ? service.value : '—';
  sDate.textContent = date && date.value ? date.value : '—';
  // simple estimate heuristic
  const base = service && service.value && service.value.toLowerCase().includes('suit') ? 120 : 50;
  sTotal.textContent = `Estimate: $${base}`;
}
