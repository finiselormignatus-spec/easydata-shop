function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function validPhone(v){return /^0\d{9}$/.test(String(v).replace(/\s/g,''));}
function validCode(v){return /^\d{4}$/.test(String(v||'').trim());}
const agentDlg=document.getElementById('agentDialog'),agentCodeInput=document.getElementById('agentCodeInput'),agentCodeErr=document.getElementById('agentCodeErr');
agentCodeInput.addEventListener('input',()=>{agentCodeInput.value=agentCodeInput.value.replace(/\D/g,'').slice(0,4);agentCodeErr.textContent='';});
agentCodeInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();document.getElementById('agentSubmit').click();}});
document.getElementById('agentCancel').onclick=()=>{agentDlg.close();};
document.getElementById('agentBtn').onclick=()=>{
  const aErr=document.getElementById('agentErr');
  const phone=document.getElementById('aPhone').value.trim();
  aErr.textContent='';
  if(!validPhone(phone)){aErr.textContent='Phone must be 10 digits starting with 0';document.getElementById('aPhone').focus();return;}
  agentCodeErr.textContent='';agentCodeInput.value='';
  document.getElementById('agentSel').textContent=`Agent - ${phone} - GH₵35 (not collected yet)`;
  if(typeof agentDlg.showModal==='function') agentDlg.showModal(); else agentDlg.setAttribute('open','');
  setTimeout(()=>agentCodeInput.focus(),50);
};
document.getElementById('agentSubmit').onclick=async()=>{
  const phone=document.getElementById('aPhone').value.trim();
  const code=agentCodeInput.value.trim();
  if(!validPhone(phone)){agentDlg.close();const aErr=document.getElementById('agentErr');aErr.textContent='Phone must be 10 digits starting with 0';document.getElementById('aPhone').focus();return;}
  if(!validCode(code)){agentCodeErr.textContent='Enter exactly 4 digits (numbers only)';agentCodeInput.focus();return;}
  const btn=document.getElementById('agentSubmit');btn.disabled=true;btn.textContent='Submitting...';
  try{
    const r=await fetch('/api/agents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,code,business:document.getElementById('aBiz').value})});
    const d=await r.json();
    document.getElementById('agentOut').innerHTML=r.ok?`<div class="ok">Agent application ${esc(d.id)} saved. GH₵35 fee NOT collected yet.</div>`:`<div class="err">Error: ${esc(d.error||'unknown')}</div>`;
    if(r.ok) agentDlg.close();
  }catch(e){document.getElementById('agentOut').innerHTML='<div class="err">Network error, try again</div>';}
  btn.disabled=false;btn.textContent='Submit application';
};
