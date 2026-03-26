export const config = { runtime: "edge" };

// ✅ লিংক বসাও
var MONETAG = [
  "https://omg10.com/4/9573408",
  "https://omg10.com/4/10761951"
];
var ADSTERRA = [
  "https://gravelsemesterflourish.com/njzj6hgct?key=b1ca251ff11a1c538e74138551d57917",
  "https://gravelsemesterflourish.com/gk1bnxuzh?key=3828edb44feba3a206e0f917260454aa",
  "https://gravelsemesterflourish.com/t4wbf2p11?key=ca9305dc4cebe01df7f379dbad798088"
];
var SPLIT = [
  "https://gravelsemesterflourish.com/f4u7gijyqf?key=0dde027d8f35a5218956e2ea32c23010",
  "https://omg10.com/4/9212231"
];

var LOW_CPM = ["IN","EG","DZ","VE","AL","YE","GT","SY","LY","PS","UA","NI","SV","CU","TT","LA","GY","BZ","FJ","SR","BW","BT","BS","TL","XK","SC","AW","NE","SB","LC","TG","GU","MQ","BB","AG","KY","SX","IR","GD","VG","DM","FO","VI","BQ","GW","JE","PW","KN","TC","GQ","DJ","AI","GI","WF","ST","MP","NR","TV","MC"];

function getCookie(header, name) {
  if (!header) return 0;
  var parts = header.split(";");
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].trim();
    if (p.indexOf(name + "=") === 0) return parseInt(p.substring(name.length + 1)) || 0;
  }
  return 0;
}

export default function handler(req) {
  try {
    var cookie = req.headers.get("cookie") || "";
    var h = new Headers({ "Cache-Control": "no-store" });

    // 35% split — প্রতি ২১ ক্লিকে প্রথম ৭টা split-এ
    var sc = getCookie(cookie, "ars") + 1;
    if (sc > 21) sc = 1;
    h.append("Set-Cookie", "ars=" + sc + "; Max-Age=1800; Path=/; SameSite=None; Secure");

    if (sc <= 7) {
      h.set("Location", SPLIT[(sc-1) % SPLIT.length]);
      return new Response(null, { status: 302, headers: h });
    }

    // country routing
    var country = req.headers.get("x-vercel-ip-country") || "XX";
    var isLow = LOW_CPM.indexOf(country) !== -1;
    var n = getCookie(cookie, "arc") + 1;
    h.append("Set-Cookie", "arc=" + n + "; Max-Age=1800; Path=/; SameSite=None; Secure");

    var dest = isLow
      ? (n === 1 ? MONETAG[0] : n === 2 ? MONETAG[1] : ADSTERRA[(n-3) % ADSTERRA.length])
      : ADSTERRA[(n-1) % ADSTERRA.length];

    h.set("Location", dest);
    return new Response(null, { status: 302, headers: h });
  } catch(e) {
    return new Response(null, { status: 302, headers: { "Location": ADSTERRA[0] } });
  }
}
