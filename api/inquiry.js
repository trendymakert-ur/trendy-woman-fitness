// 상담 신청서 → 텔레그램 알림 (Vercel Serverless Function)
// 환경변수: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

const esc = (s) => String(s ?? '').replace(/[<&>]/g, (c) => ({ '<': '&lt;', '&': '&amp;', '>': '&gt;' }[c]));

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(503).json({ ok: false, error: 'not_configured' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { name = '', phone = '', purpose = '', visit = '', exp = '', message = '', website = '' } = body || {};

  // 봇이 채우는 숨은 필드가 있으면 조용히 무시
  if (website) return res.status(200).json({ ok: true });

  const n = String(name).trim().slice(0, 50);
  const p = String(phone).trim().slice(0, 30);
  if (!n || !p) return res.status(400).json({ ok: false, error: 'invalid' });

  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
  const text =
    `🧡 <b>새 상담 신청</b> — 트렌디우먼휘트니스 청량리역점\n\n` +
    `👤 성함: <b>${esc(n)}</b>\n` +
    `📞 연락처: <b>${esc(p)}</b>\n` +
    `🏷 관심 프로그램: ${esc(purpose || '-')}\n` +
    `🕒 방문 희망: ${esc(visit || '-')}\n` +
    `💪 운동 경험: ${esc(exp || '-')}\n` +
    `📝 문의:\n${esc(String(message).trim().slice(0, 1000) || '-')}\n\n` +
    `⏰ ${now}`;

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: 'telegram_failed' });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ ok: false, error: 'telegram_error' });
  }
};
