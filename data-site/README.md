# Easydata Shop v1
- Pick network (MTN, Telecel, AirtelTigo) and data amount, enter phone + 4-digit code in the popup, place order (saved pending, payment NOT enabled)
- Become an Agent GH₵35: apply form (name + phone) then enter 4-digit code in the popup, saved pending_fee, fee NOT collected
- API: GET /api/bundles, POST /api/orders (requires phone, network, bundleId, 4-digit code), POST /api/agents, GET /health
- Telegram: order/agent details are sent to your bot if configured via env vars (see .env.example). If not configured, orders still save locally and the API reply says configured=false. No bot token is hardcoded.
- Run: npm install and npm start, open http://localhost:3000
- Deploy Render: build npm install, start npm start, add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID under Environment
- TODO: fulfilment API, admin login. No payment gateway integrated (owner instruction).
