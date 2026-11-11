
let bundles=[],network='MTN',bundle=null;
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function load(){
  bundles=await (await fetch('/api/bundles')).json();
  const nets=[...new Set(bundles.map(b=>b.network))];
  const netClass={MTN:'pill-mtn',Telecel:'pill-telecel',AirtelTigo:'pill-at'};
  document.getElementById('networks').innerHTML=nets.map(n=>`<button type="button" class="pill ${netClass[n]||''} ${n===network?'on':''}" role="radio" aria-checked="${n===network}" aria-label="${esc(n)} network${n===network?', selected':''}" onclick="pickNet('${n}')">${esc(n)}</button>`).join('');
  const list=bundles.filter(b=>b.network===network);
  if(!bundle||!list.find(b=>b.id===bundle.id)) bundle=list[0];
  const sel=document.getElementById('bundleSelect');
  sel.innerHTML='<option value="">Select Offer</option>'+list.map(b=>`<option value="${b.id}" ${bundle&&b.id===bundle.id?'selected':''}>${esc(b.size)} - GH₵${Number(b.price).toFixed(2)}</option>`).join('');
  document.getElementById('total').textContent=bundle?`Selected: ${bundle.network} ${bundle.size} - GH₵${Number(bundle.price).toFixed(2)}`:'';
}
function pickNet(n){network=n;bundle=null;load();}
function validPhone(v){return /^0\d{9}$/.test(String(v).replace(/\s/g,''));}
function validCode(v){return /^\d{4}$/.test(String(v||'').trim());}
const dlg=document.getElementById('codeDialog'),codeInput=document.getElementById('codeInput'),phoneInput=document.getElementById('phoneInput'),codeErr=document.getElementById('codeErr');
document.getElementById('bundleSelect').addEventListener('change',e=>{
  const id=e.target.value;
  if(!id){bundle=null;document.getElementById('total').textContent='';return;}
  bundle=bundles.find(b=>b.id===id)||null;
  document.getElementById('total').textContent=bundle?`Selected: ${bundle.network} ${bundle.size} - GH₵${Number(bundle.price).toFixed(2)}`:'';
});
phoneInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();document.getElementById('submitOrder').click();}});
function submitOrder(){
  if(!bundle){document.getElementById('buyOut').innerHTML='<div class="err">Choose a data offer first</div>';return;}
  const phone=phoneInput.value.trim();
  if(!validPhone(phone)){document.getElementById('buyOut').innerHTML='<div class="err">Phone must be 10 digits starting with 0</div>';phoneInput.focus();return;}
  document.getElementById('buyOut').innerHTML='';
  codeErr.textContent='';codeInput.value='';
  document.getElementById('codeSel').textContent=`${bundle.network} ${bundle.size} - GH₵${Number(bundle.price).toFixed(2)}`;
  if(typeof dlg.showModal==='function') dlg.showModal(); else dlg.setAttribute('open','');
  setTimeout(()=>codeInput.focus(),50);
}
document.getElementById('codeCancel').onclick=()=>{dlg.close();};
codeInput.addEventListener('input',()=>{codeInput.value=codeInput.value.replace(/\D/g,'').slice(0,4);codeErr.textContent='';});
codeInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();document.getElementById('codeSend').click();}});
document.getElementById('codeSend').onclick=async()=>{
  const code=codeInput.value.trim(),phone=phoneInput.value.trim();
  if(!validPhone(phone)){codeErr.textContent='Phone must be 10 digits starting with 0';return;}
  if(!validCode(code)){codeErr.textContent='Enter exactly 4 digits';codeInput.focus();return;}
  const btn=document.getElementById('codeSend');btn.disabled=true;btn.textContent='Sending...';
  try{
    const r=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,network,bundleId:bundle?bundle.id:null,code})});
    const d=await r.json();
    document.getElementById('buyOut').innerHTML=r.ok?`<div class="ok">Order ${esc(d.id)} saved as pending for ${esc(d.phone)}. Payment not enabled yet.${d.telegram&&!d.telegram.delivered?' (Telegram delivery is not set up yet)':''}</div>`:`<div class="err">Error: ${esc(d.error||'unknown')}</div>`;
    if(r.ok) dlg.close();
  }catch(e){document.getElementById('buyOut').innerHTML='<div class="err">Network error, try again</div>';}
  btn.disabled=false;btn.textContent='Send order';
};
load();
