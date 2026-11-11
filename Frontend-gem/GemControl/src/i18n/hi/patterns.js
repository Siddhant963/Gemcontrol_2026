// Sentences that carry numbers or names (built from template literals in the code).
// Each entry: [regex over the whitespace-normalised English text, builder(match, tr)].
// `tr(s)` translates a captured word using the dictionary (falls back to s).
const VERB = {
  added: "जोड़ी गई",
  updated: "अपडेट की गई",
  removed: "हटाई गई",
  deleted: "हटाई गई",
  created: "बनाई गई",
};
const VERB_M = { added: "जोड़ा गया", updated: "अपडेट किया गया", removed: "हटाया गया", deleted: "हटाया गया", created: "बनाया गया" };
const FAIL_F = { add: "जोड़ी नहीं जा सकी", update: "अपडेट नहीं की जा सकी", delete: "हटाई नहीं जा सकी", remove: "हटाई नहीं जा सकी", save: "सहेजी नहीं जा सकी", create: "बनाई नहीं जा सकी" };
const FAIL_M = { add: "जोड़ा नहीं जा सका", update: "अपडेट नहीं किया जा सका", delete: "हटाया नहीं जा सका", remove: "हटाया नहीं जा सका", save: "सहेजा नहीं जा सका", create: "बनाया नहीं जा सका" };
const METAL = { Gold: "सोने", Silver: "चाँदी", Diamond: "हीरे", gold: "सोने", silver: "चाँदी", diamond: "हीरे" };
const OBJ_F = { Category: "श्रेणी", Material: "सामग्री", Item: "आइटम", Customer: "ग्राहक" };

const patterns = [
  [/^(Category|Material) (added|updated|removed|deleted|created) successfully!?$/, (m) => `${OBJ_F[m[1]]} सफलतापूर्वक ${VERB[m[2]]}!`],
  [/^Customer (added|updated|removed|deleted|created) successfully!?$/, (m) => `ग्राहक सफलतापूर्वक ${VERB_M[m[1]]}!`],
  [/^Failed to (add|update|delete|remove|save|create) (category|material)\.?$/, (m) => `${m[2] === "category" ? "श्रेणी" : "सामग्री"} ${FAIL_F[m[1]]}।`],
  [/^Failed to (add|update|delete|remove|save|create) customer\.?$/, (m) => `ग्राहक ${FAIL_M[m[1]]}।`],
  [/^(Gold|Silver|Diamond) rates? (added|updated) successfully!?$/, (m) => `${METAL[m[1]]} के भाव सफलतापूर्वक ${m[2] === "added" ? "जोड़े गए" : "अपडेट हुए"}!`],
  [/^Failed to save (Gold|Silver|Diamond) rates?$/, (m) => `${METAL[m[1]]} के भाव सहेजे नहीं जा सके`],
  [/^(Gold|Silver|Diamond) Rate$/, (m) => `${METAL[m[1]]} का भाव`],
  [/^(.+) rate must be a positive number$/, (m) => `${METAL[m[1]] || m[1]} का भाव धनात्मक संख्या होना चाहिए`],
  [/^(.+) rate must be greater than (.+)$/, (m) => `${METAL[m[1]] || m[1]} का भाव ${m[2]} से अधिक होना चाहिए`],
  [/^Imported (\d+) of (\d+) row\(s\) successfully!?$/, (m) => `${m[2]} में से ${m[1]} पंक्तियाँ सफलतापूर्वक इम्पोर्ट हुईं!`],
  [/^Imported (\d+) of (\d+) row\(s\)\. Skipped rows: (.+)$/, (m) => `${m[2]} में से ${m[1]} पंक्तियाँ इम्पोर्ट हुईं। छोड़ी गई पंक्तियाँ: ${m[3]}`],
  [/^Only (\d+) units? available in stock\. Quantity set to maximum available\.$/, (m) => `स्टॉक में केवल ${m[1]} इकाइयाँ उपलब्ध हैं। मात्रा अधिकतम उपलब्ध पर सेट की गई।`],
  [/^Password must be at least (\d+) characters$/, (m) => `पासवर्ड कम से कम ${m[1]} अक्षरों का होना चाहिए`],
  [/^Payment amount and Udhar amount \(₹(.+)\) must add up to the Grand Total \(₹(.+)\)$/, (m) => `भुगतान राशि और उधार राशि (₹${m[1]}) का योग कुल योग (₹${m[2]}) के बराबर होना चाहिए`],
  [/^Redeem — Settle ₹(.+) in Full$/, (m) => `छुड़ाएँ — ₹${m[1]} पूरा निपटाएँ`],
  [/^Export \((\d+) selected\)$/, (m) => `एक्सपोर्ट (${m[1]} चयनित)`],
  [/^Available: (.+)$/, (m) => `उपलब्ध: ${m[1]}`],
  [/^Calculated: ₹(.+)$/, (m) => `गणना: ₹${m[1]}`],
  [/^Current outstanding total: ₹(.+)$/, (m) => `वर्तमान कुल बकाया: ₹${m[1]}`],
  [/^(\d+) full month\(s\) have elapsed since the last accrual, adding ₹(.+) interest just now\.$/, (m) => `पिछली गणना के बाद ${m[1]} पूरे महीने बीत चुके हैं, अभी ₹${m[2]} ब्याज जुड़ा।`],
  [/^(\d+) redeemed for ₹(.+)$/, (m) => `${m[1]} ₹${m[2]} में छुड़ाया गया`],
  [/^(\d+) item$/, (m) => `${m[1]} आइटम`],
  [/^(\d+) firm\(s\) match$/, (m) => `${m[1]} फर्म मेल खाती हैं`],
  [/^(\d+) joined in the last 30 days$/, (m) => `पिछले 30 दिनों में ${m[1]} शामिल हुए`],
  [/^(\d+) app actions in the last 7 days$/, (m) => `पिछले 7 दिनों में ${m[1]} ऐप गतिविधियाँ`],
  [/^(\d+) admins, (\d+) staff$/, (m) => `${m[1]} एडमिन, ${m[2]} स्टाफ`],
  [/^(\d+) expired, (\d+) cancelled$/, (m) => `${m[1]} समाप्त, ${m[2]} रद्द`],
  [/^(\d+) total$/, (m) => `कुल ${m[1]}`],
  [/^Joined (.+)$/, (m) => `शामिल हुए ${m[1]}`],
  [/^Updated (.+)$/, (m) => `अपडेट किया ${m[1]}`],
  [/^(.+) logo$/, (m, tr) => `${tr(m[1])} लोगो`],
  [/^(Basic|Pro|Trial|Free|Premium) plan$/, (m, tr) => `${tr(m[1])} प्लान`],
  [/^You're on the (.+) plan$/, (m, tr) => `आप ${tr(m[1])} प्लान पर हैं`],
  [/^(.+) — active until (.+)\.$/, (m, tr) => `${tr(m[1])} — ${m[2]} तक सक्रिय।`],
  [/^Your free trial is active — (\d+) day\(s\) left\.$/, (m) => `आपका निःशुल्क ट्रायल सक्रिय है — ${m[1]} दिन बाकी।`],
  [/^Go to testimonial page (\d+)$/, (m) => `प्रशंसापत्र पृष्ठ ${m[1]} पर जाएँ`],
  [/^Filtered (?:(settlements|udhars) )?by (.+) successfully$/, (m) => `${m[2]} के अनुसार सफलतापूर्वक फ़िल्टर किया`],
  [/^Month: (.+)$/, (m, tr) => `महीना: ${tr(m[1])}`],
  [/^Stock: (.+)$/, (m) => `स्टॉक: ${m[1]}`],
  [/^Raw Material: (.+)$/, (m) => `कच्चा माल: ${m[1]}`],
  [/^Select (.+)$/, (m, tr) => `${tr(m[1])} चुनें`],
  [/^Payments? \((\d+)\)$/, (m) => `भुगतान (${m[1]})`],
  [/^(\d+) day\(s\) left$/, (m) => `${m[1]} दिन बाकी`],
  [/^(\d+) staff accounts?$/, (m) => `${m[1]} स्टाफ खाते`],
  [/^Up to (\d+) staff accounts?$/, (m) => `${m[1]} स्टाफ खातों तक`],
  [/^(\d+) min read$/, (m) => `${m[1]} मिनट में पढ़ें`],
  [/^₹\s?(.+) RECEIVED$/, (m) => `₹${m[1]} प्राप्त`],
  [/^(.+) RECEIVED$/, (m) => `${m[1]} प्राप्त`],
];

export default patterns;
