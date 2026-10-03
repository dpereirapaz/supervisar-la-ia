// Genera assets/img/favicon.png (512 px) a partir del diseño D-08 con la fuente Poppins autoalojada
import { chromium } from "playwright";
import { writeFile, unlink } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const tmp = path.join(root, "assets", "img", ".favicon.html");
await writeFile(tmp, `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:"Poppins";font-weight:600;src:url("../fonts/poppins-600.woff2") format("woff2")}
  html,body{margin:0;width:512px;height:512px;background:transparent}
  .f{width:512px;height:512px;border-radius:112px;background:#18212F;display:flex;align-items:center;justify-content:center}
  .f span{font-family:Poppins;font-weight:600;font-size:352px;line-height:1;color:#C8102E;transform:translateY(10px)}
</style></head><body><div class="f"><span>6</span></div></body></html>`);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
await page.goto(pathToFileURL(tmp).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(root, "assets", "img", "favicon.png"), omitBackground: true });
await browser.close();
await unlink(tmp);
console.log("ok assets/img/favicon.png");
