// A-02: Lighthouse en modo móvil sobre / y /autoevaluacion/ (SPEC.md, sección 11)
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:8000";
const targets = [`${BASE}/`, `${BASE}/autoevaluacion/`];
const minimums = { performance: 95, accessibility: 100, "best-practices": 100, seo: 100 };

const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ["--headless=new", "--no-sandbox"] });
let failed = false;
for (const url of targets) {
  const result = await lighthouse(url, { port: chrome.port, output: "json", logLevel: "error", onlyCategories: Object.keys(minimums) });
  const cats = result.lhr.categories;
  const line = Object.keys(minimums).map((k) => {
    const score = Math.round(cats[k].score * 100);
    if (score < minimums[k]) failed = true;
    return `${k}=${score}${score < minimums[k] ? " (FALLA)" : ""}`;
  }).join("  ");
  console.log(url, "\n  ", line);
  for (const k of Object.keys(minimums)) {
    const audits = cats[k].auditRefs.filter((r) => r.weight > 0 && result.lhr.audits[r.id].score !== null && result.lhr.audits[r.id].score < 1);
    for (const a of audits) console.log("   -", k, a.id, Math.round((result.lhr.audits[a.id].score || 0) * 100));
  }
}
await chrome.kill();
process.exit(failed ? 1 : 0);
