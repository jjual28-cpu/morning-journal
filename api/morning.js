// 아침 알림 보내기 — 구글 스크립트의 매일 아침 트리거(morningPush)가 호출함.
// 토큰(t)은 여기 저장하지 않고 그대로 스크립트에 넘겨 확인받는다.
// ?only=<endpoint> 를 붙이면 그 기기에만 테스트 알림을 보낸다.
const webpush = require("web-push");

const SCRIPT_URL = process.env.SCRIPT_URL;
const APP_URL = "https://jjual-miracle-morning.vercel.app";

module.exports = async (req, res) => {
  const t = String((req.query && req.query.t) || "");
  const only = String((req.query && req.query.only) || "");
  if (!t || !SCRIPT_URL || !process.env.VAPID_PRIVATE_KEY) return res.status(400).json({ ok: false, error: "not-configured" });

  const r = await fetch(SCRIPT_URL + "?token=" + encodeURIComponent(t) + "&kind=subs");
  const j = await r.json().catch(() => ({}));
  if (!j.ok) return res.status(401).json({ ok: false, error: j.error || "unauthorized" });

  webpush.setVapidDetails(APP_URL, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  let subs = j.subs || [];
  if (only) subs = subs.filter((s) => s.endpoint === only);

  const payload = JSON.stringify({
    title: only ? "🔔 테스트 알림" : "☀️ 좋은 아침이에요",
    body: only ? "아침 알림이 잘 연결됐어요!" : "오늘의 시각화를 소리 내어 읽고, 감사한 일 3가지를 적어볼까요?",
    url: APP_URL + "/",
  });

  let sent = 0;
  const gone = [];
  await Promise.all(subs.map((s) =>
    webpush.sendNotification(s, payload, { TTL: 3600 })
      .then(() => { sent++; })
      .catch((e) => { if (e.statusCode === 404 || e.statusCode === 410) gone.push(s.endpoint); })
  ));

  // 지워진 구독(앱 삭제 등)은 스크립트에서도 정리
  if (gone.length) {
    await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ token: t, kind: "unsubscribe", endpoints: gone }),
    }).catch(() => {});
  }
  res.status(200).json({ ok: true, total: subs.length, sent, removed: gone.length });
};
