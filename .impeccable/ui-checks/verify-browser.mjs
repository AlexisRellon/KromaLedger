import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const layoutOnly = process.argv.includes('--layout');
const avatarOnly = layoutOnly || process.argv.includes('--avatar');
const details = avatarOnly || process.argv.includes('--details');
const target = details
  ? (await fetch('http://127.0.0.1:9223/json/list').then(r => r.json())).find(t => t.url.startsWith('http://127.0.0.1:5173'))
  : await fetch('http://127.0.0.1:9223/json/new?http://127.0.0.1:5173/', { method: 'PUT' }).then(r => r.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
let sequence = 0;
const pending = new Map();
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (!message.id) return;
  const entry = pending.get(message.id);
  if (!entry) return;
  pending.delete(message.id);
  clearTimeout(entry.timer);
  message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
});
function call(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const value = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (value.exceptionDetails) throw new Error(value.exceptionDetails.text + ': ' + value.exceptionDetails.exception?.description);
  return value.result.value;
}
async function ready(expression) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Page readiness condition timed out: ' + expression);
}
const audit = await readFile(new URL('./contrast-audit.js', import.meta.url), 'utf8');
async function record(name) {
  await evaluate('document.fonts.ready');
  const report = JSON.parse(await evaluate(audit));
  assert(report.checked > 10, 'Audit must include rendered text');
  await writeFile(new URL(`./final-${name}.json`, import.meta.url), JSON.stringify(report, null, 2));
  const capture = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(new URL(`./final-${name}.png`, import.meta.url), Buffer.from(capture.data, 'base64'));
  console.log(JSON.stringify({ name, checked: report.checked, failures: report.failures, manualGradientCount: report.manualGradientCount }));
}
try {
  await call('Page.enable');
  if (avatarOnly) {
    if (!layoutOnly) {
    await evaluate('[...document.querySelectorAll("nav button")].find(e=>e.textContent.trim()==="Settings").click()');
    await new Promise(resolve => setTimeout(resolve, 400));
    await record('chrome-settings-verified');
    await evaluate('[...document.querySelectorAll("button")].find(e=>e.textContent.trim()==="Edit Profile").click()');
    await ready('document.querySelector("[role=dialog]")?.textContent.includes("Edit Local Profile")');
    await new Promise(resolve => setTimeout(resolve, 350));
    await record('chrome-profile-verified');
    await evaluate('[...document.querySelectorAll("[role=dialog] button")].find(e=>/close/i.test(e.getAttribute("aria-label")||""))?.click()');
    await ready('!document.querySelector("[role=dialog]")');
    }
    for (const width of [390, 320]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
      const dimensions = await evaluate('JSON.stringify({viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,logoWidth:document.querySelector("header img").getBoundingClientRect().width,headerRight:Math.max(...[...document.querySelectorAll("header button")].map(e=>e.getBoundingClientRect().right))})');
      console.log(dimensions);
      const geometry = JSON.parse(dimensions);
      assert(!geometry.overflow && geometry.headerRight <= width, 'Mobile header controls must fit');
      assert(geometry.logoWidth >= 160, 'Approved signature must retain minimum width');
      const capture = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await writeFile(new URL(`./final-header-${width}.png`, import.meta.url), Buffer.from(capture.data, 'base64'));
    }
  } else if (details) {
    await evaluate('[...document.querySelectorAll("[role=dialog] button")].find(e=>/close/i.test(e.getAttribute("aria-label")||""))?.click()');
    await ready('!document.querySelector("[role=dialog]")');
    await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await evaluate('document.querySelector("button[aria-label=\\"Add new card or wallet\\"]").click()');
    await ready('document.querySelector("[role=dialog]")?.textContent.includes("Add Wallet Card")');
    await new Promise(resolve => setTimeout(resolve, 350));
    await record('chrome-wallet-form');
    console.log(await evaluate('JSON.stringify([...document.querySelectorAll("[role=dialog] [style]")].filter(e=>getComputedStyle(e).backgroundImage!=="none").map(e=>({gradient:getComputedStyle(e).backgroundImage,background:getComputedStyle(e).backgroundColor,foreground:getComputedStyle(e).color})))'));
    await evaluate('[...document.querySelectorAll("[role=dialog] button")].find(e=>/close/i.test(e.getAttribute("aria-label")||""))?.click()');
    await ready('!document.querySelector("[role=dialog]")');
    await evaluate('document.querySelector("button[aria-label=\\"Kaban Intelligence\\"]").click()');
    await ready('document.querySelector("[role=dialog]")?.textContent.includes("Advisory")');
    const fixture = '# Contrast verification\\n\\n## Week overview\\n\\nYou currently hold **PHP 266.35** against commitments of `PHP 275.00`.\\n\\n- **Pause autopay:** Review the upcoming subscription.\\n- Keep a cash buffer.\\n\\n1. Review active wallets.\\n2. Reconcile this month.\\n\\n> Keep your financial data on this device.\\n\\n| Category | Amount |\\n| --- | ---: |\\n| Food | PHP 300.00 |\\n\\n```text\\ncash - commitments = buffer\\n```';
    await evaluate(`(async()=>{const rs=performance.getEntriesByType("resource").map(x=>x.name);const r=await import(rs.find(x=>/\\/react\\.js\\?/.test(x)));const c=await import(rs.find(x=>/\\/react-dom_client\\.js\\?/.test(x)));const m=await import("/src/ui/components/MarkdownRenderer.tsx");const h=document.createElement("section");h.id="contrast-fixture";h.style.cssText="position:absolute;inset:100px 20px 120px 340px;overflow:auto;background:#FAF8F5;z-index:1000;padding:24px;border:2px solid #18181b";document.querySelector("[role=dialog]").append(h);window.auditRoot=(c.default||c).createRoot(h);window.auditRoot.render((r.default||r).createElement(m.MarkdownRenderer,{content:${JSON.stringify(fixture.replaceAll('\\n', '\n'))}}));})()`);
    await new Promise(resolve => setTimeout(resolve, 350));
    await record('chrome-markdown');
    await evaluate('window.auditRoot.unmount();document.querySelector("#contrast-fixture").remove();');
    await evaluate('[...document.querySelectorAll("[role=dialog] button")].find(e=>/close/i.test(e.getAttribute("aria-label")||""))?.click()');
    await ready('!document.querySelector("[role=dialog]")');
    for (const [label, name] of [['Wallets', 'wallets'], ['Upcoming', 'upcoming'], ['Settings', 'settings']]) {
      await evaluate(`[...document.querySelectorAll("nav button")].find(e=>e.textContent.trim()===${JSON.stringify(label)}).click()`);
      await new Promise(resolve => setTimeout(resolve, 400));
      await record(`chrome-${name}`);
    }
  } else {
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await ready('document.body.innerText.includes("Wallets & Accounts") && !document.querySelector(".animate-pulse")');
  await new Promise(resolve => setTimeout(resolve, 350));
  await record('chrome-desktop-home');
  console.log(await evaluate('JSON.stringify({logo:[...document.querySelectorAll("header img")].map(e=>({src:e.getAttribute("src"),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),overflow:document.documentElement.scrollWidth>innerWidth})'));
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await new Promise(resolve => setTimeout(resolve, 150));
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false, 'Mobile horizontal overflow');
  await record('chrome-mobile-home');
  await evaluate('[...document.querySelectorAll("button")].find(e=>e.textContent.includes("Quick Add Entry")).click()');
  await ready('!!document.querySelector("[role=dialog]")');
  await new Promise(resolve => setTimeout(resolve, 300));
  await record('chrome-mobile-quick-add');
  }
} finally {
  socket.close();
}
