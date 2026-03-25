// ============================================================
// SYSTEM 2 — Vercel Edge Function
// Country-based Router + 35% Split Traffic
// ============================================================
//
// লজিক:
// - প্রতি ২১ ক্লিকের cycle:
//     ক্লিক ১-৭  → Split Links (৩৫%)
//     ক্লিক ৮-২১ → Country routing (৬৫%)
//       Low CPM  → ১ম Monetag 1, ২য় Monetag 2, ৩য়+ Adsterra rotate
//       High CPM → Adsterra Smartlink rotate
// - ৩০ মিনিট পর reset
// ============================================================

export const config = { runtime: "edge" };

// ✅ MONETAG লিংক — এখানে তোমার লিংক বসাও
var MONETAG_LINKS = [
  "https://omg10.com/4/9573408",
  "https://omg10.com/4/10761951"
];

// ✅ ADSTERRA Smartlink — এখানে তোমার লিংক বসাও
var ADSTERRA_LINKS = [
  "https://gravelsemesterflourish.com/njzj6hgct?key=b1ca251ff11a1c538e74138551d57917",
  "https://gravelsemesterflourish.com/gk1bnxuzh?key=3828edb44feba3a206e0f917260454aa",
  "https://gravelsemesterflourish.com/t4wbf2p11?key=ca9305dc4cebe01df7f379dbad798088"
];

// ✅ 35% SPLIT লিংক — এখানে তোমার লিংক বসাও
var SPLIT_LINKS = [
  "https://gravelsemesterflourish.com/f4u7gijyqf?key=0dde027d8f35a5218956e2ea32c23010",
  "https://omg10.com/4/9212231"
];

// Low CPM Country List (CPM < $0.50)
var LOW_CPM = ["IN","EG","DZ","VE","AL","YE","GT","SY","LY","PS",
  "UA","NI","SV","CU","TT","LA","GY","BZ","FJ","SR",
  "BW","BT","BS","TL","XK","SC","AW","NE","SB","LC",
  "TG","GU","MQ","BB","AG","KY","SX","IR","GD","VG",
  "DM","FO","VI","BQ","GW","JE","PW","KN","TC","GQ",
  "DJ","AI","GI","WF","ST","MP","NR","TV","MC"];

var COOKIE_MAIN  = "arc";
var COOKIE_SPLIT = "ars";
var RESET_SEC = 1800; // 30 মিনিট

function parseCookie(header) {
  var result = {};
  if (!header) return result;
  var parts = header.split(";");
  for (var i = 0; i < parts.length; i++) {
    var eq = parts[i].indexOf("=");
    if (eq < 0) continue;
    var k = parts[i].substring(0, eq).trim();
    var v = parts[i].substring(eq + 1).trim();
    result[k] = decodeURIComponent(v);
  }
  return result;
}

export default function handler(request) {
  try {
    var cookies = parseCookie(request.headers.get("cookie") || "");
    var headers = new Headers();
    headers.set("Cache-Control", "no-store");

    // ── SPLIT LOGIC: প্রতি ২১ ক্লিক cycle, প্রথম ৭টা split ──
    var splitCount = parseInt(cookies[COOKIE_SPLIT] || "0");
    var newSplitCount = splitCount + 1;
    if (newSplitCount > 21) newSplitCount = 1;

    headers.append("Set-Cookie",
      COOKIE_SPLIT + "=" + newSplitCount + "; Max-Age=" + RESET_SEC + "; Path=/; SameSite=None; Secure");

    if (newSplitCount >= 1 && newSplitCount <= 7) {
      // ক্লিক ১-৭ → Split (৩৫%)
      var splitIdx = (newSplitCount - 1) % SPLIT_LINKS.length;
      headers.set("Location", SPLIT_LINKS[splitIdx]);
      return new Response(null, { status: 302, headers: headers });
    }

    // ── COUNTRY ROUTING: ক্লিক ৮-২১ (৬৫%) ──
    var country = request.headers.get("x-vercel-ip-country") || "XX";
    var isLowCPM = LOW_CPM.indexOf(country) !== -1;

    var clickCount = parseInt(cookies[COOKIE_MAIN] || "0");
    var newCount = clickCount + 1;

    headers.append("Set-Cookie",
      COOKIE_MAIN + "=" + newCount + "; Max-Age=" + RESET_SEC + "; Path=/; SameSite=None; Secure");

    var destination;
    if (isLowCPM) {
      if (newCount === 1) {
        destination = MONETAG_LINKS[0];
      } else if (newCount === 2) {
        destination = MONETAG_LINKS[1];
      } else {
        destination = ADSTERRA_LINKS[(newCount - 3) % ADSTERRA_LINKS.length];
      }
    } else {
      destination = ADSTERRA_LINKS[(newCount - 1) % ADSTERRA_LINKS.length];
    }

    headers.set("Location", destination);
    return new Response(null, { status: 302, headers: headers });

  } catch (e) {
    return new Response(null, {
      status: 302,
      headers: { "Location": ADSTERRA_LINKS[0] }
    });
  }
}
