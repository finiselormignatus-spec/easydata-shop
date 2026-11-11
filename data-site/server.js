const express=require('express');
const fs=require('fs'); const path=require('path');
const {sendTelegramMessage,formatOrderMessage,formatAgentMessage,getConfig}=require('./telegramNotifier');
const app=express();
const ROOT=__dirname;
app.use(express.json({limit:'100kb'})); app.use(express.static(path.join(ROOT,'public')));
const PORT=process.env.PORT||3000;
const read=n=>JSON.parse(fs.readFileSync(path.join(ROOT,'data',n),'utf8'));
const write=(n,d)=>fs.writeFileSync(path.join(ROOT,'data',n),JSON.stringify(d,null,2));
const VALID_NETWORKS=['MTN','Telecel','AirtelTigo'];
function normalizePhone(p){
  let s=String(p||'').trim().replace(/[\s\-\(\)]/g,'');
  if(/^\+233\d{9}$/.test(s)) s='0'+s.slice(4);
  if(/^233\d{9}$/.test(s)) s='0'+s.slice(3);
  return s;
}
function isValidPhone(p){ return /^0\d{9}$/.test(normalizePhone(p)); }
function isValidCode(c){ return /^\d{4}$/.test(String(c||'').trim()); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
app.get('/api/bundles',(req,res)=>{
  let b=read('bundles.json');
  if(req.query.network) b=b.filter(x=>x.network.toLowerCase()===String(req.query.network).toLowerCase());
  res.json(b);
});
app.post('/api/orders',async (req,res)=>{
  const {phone,network,bundleId,code}=req.body||{};
  if(!phone||!network||!bundleId||!code) return res.status(400).json({error:'phone, network, bundleId and 4-digit code required'});
  if(!VALID_NETWORKS.includes(network)) return res.status(400).json({error:'invalid network'});
  if(!isValidPhone(phone)) return res.status(400).json({error:'phone must be 10 digits starting 0'});
  if(!isValidCode(code)) return res.status(400).json({error:'code must be exactly 4 digits'});
  const b=read('bundles.json').find(x=>x.id===bundleId);
  if(!b) return res.status(400).json({error:'bundle not found'});
  if(b.network!==network) return res.status(400).json({error:'bundle does not match network'});
  const orders=read('orders.json');
  const order={id:'ORD-'+Date.now().toString().slice(-8),status:'pending',createdAt:new Date().toISOString(),phone:normalizePhone(phone),network,size:b.size,price:b.price,code:String(code).trim(),payment:'not_enabled_demo_only'};
  orders.push(order); write('orders.json',orders);
  // Send to Telegram if configured; never block or fail the order save if not/dead
  let telegram={ok:false,skipped:true,reason:'telegram_not_configured'};
  try{ telegram=await sendTelegramMessage(formatOrderMessage(order)); }catch(e){ telegram={ok:false,reason:'telegram_send_failed'}; }
  res.status(201).json({...order,message:'Order saved as pending. Payment is not enabled yet, this is a demo order.',telegram:{configured:getConfig().enabled,delivered:!!telegram.ok,reason:telegram.reason||null}});
});
app.post('/api/agents',async (req,res)=>{
  const {name,phone,code,business}=req.body||{};
  if(!name||!phone||!code) return res.status(400).json({error:'name, phone and 4-digit code required'});
  if(!isValidPhone(phone)) return res.status(400).json({error:'phone must be 10 digits starting 0'});
  if(!isValidCode(code)) return res.status(400).json({error:'code must be exactly 4 digits'});
  const agents=read('agents.json');
  const a={id:'AGT-'+Date.now().toString().slice(-8),status:'pending_fee',fee:35,currency:'GHS',createdAt:new Date().toISOString(),name:escapeHtml(String(name).trim()).slice(0,100),phone:normalizePhone(phone),code:String(code).trim(),business:business?escapeHtml(String(business).trim()).slice(0,100):'',payment:'not_collected_demo_only'};
  agents.push(a); write('agents.json',agents);
  let telegram={ok:false,skipped:true,reason:'telegram_not_configured'};
  try{ telegram=await sendTelegramMessage(formatAgentMessage(a)); }catch(e){ telegram={ok:false,reason:'telegram_send_failed'}; }
  res.status(201).json({...a,message:'Application saved. GH₵35 fee is NOT collected. Add a payment provider to enable.',telegram:{configured:getConfig().enabled,delivered:!!telegram.ok,reason:telegram.reason||null}});
});
app.get('/health',(req,res)=>res.json({ok:true,site:'Easydata Shop',telegram_configured:getConfig().enabled}));
app.listen(PORT,()=>console.log('Easydata Shop on http://localhost:'+PORT));
