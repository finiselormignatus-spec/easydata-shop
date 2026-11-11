// Telegram delivery helper for Easydata Shop.
// Config comes ONLY from environment variables, never from code or chat.
// Required env vars:
//   TELEGRAM_BOT_TOKEN   the bot token issued by @BotFather (secret)
//   TELEGRAM_CHAT_ID     numeric chat_id of the recipient/admin chat
// Compat fallback: BOT_TOKEN / CHAT_ID also accepted.
function getConfig(){
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '';
  const chatId = process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID || '';
  return {token,chatId,enabled: !!(token && chatId)};
}
async function sendTelegramMessage(text){
  const c=getConfig(); const token=c.token; const chatId=c.chatId; const enabled=c.enabled;
  if(!enabled) return {ok:false, skipped:true, reason:'telegram_not_configured'};
  if(!chatId || !/^-?\d+$/.test(String(chatId).trim())) return {ok:false, skipped:true, reason:'telegram_chat_id_must_be_numeric'};
  try{
    const url='https://api.telegram.org/bot'+token+'/sendMessage';
    const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),8000);
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:String(chatId).trim(),text:String(text).slice(0,4000),disable_web_page_preview:true}),signal:ctrl.signal});
    clearTimeout(t);
    if(!res.ok) return {ok:false, reason:'telegram_api_error', status:res.status};
    const j=await res.json().catch(()=>null);
    return {ok: !!(j && j.ok)};
  }catch(e){ return {ok:false, reason:'telegram_send_failed'}; }
}
function formatOrderMessage(order){
  return ['Easydata Shop - New order','Order: '+order.id,'Phone: '+order.phone,'Network: '+order.network,'Bundle: '+order.size,'Code: '+order.code,'Status: '+order.status,'Time: '+order.createdAt].join('\n');
}
function formatAgentMessage(agent){
return ['Easydata Shop - New agent application','Application: '+agent.id,'Phone: '+agent.phone,'Code: '+agent.code,'Fee: GH₵'+agent.fee,'Status: '+agent.status,'Time: '+agent.createdAt].join('\n');
}
module.exports={getConfig,sendTelegramMessage,formatOrderMessage,formatAgentMessage};
