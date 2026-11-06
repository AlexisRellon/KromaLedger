import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const target = await fetch('http://127.0.0.1:9337/json/new?http://127.0.0.1:4173/', { method: 'PUT' }).then(r => r.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let sequence = 0;
const pending = new Map();
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  const entry = pending.get(message.id);
  if (!entry) return;
  pending.delete(message.id);
  clearTimeout(entry.timer);
  message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
});
function call(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(method)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const response = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
}
try {
  await call('Page.enable');
  const deadline = Date.now() + 20000;
  while (!(await evaluate('!!document.querySelector("header img[alt=Kaban]")'))) {
    assert(Date.now() < deadline, 'App header must finish loading');
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.equal(await evaluate('(async()=>{const img=new Image();img.src="/kaban-symbol-small.svg";await img.decode();return img.naturalWidth>0})()'), true);
  await evaluate('document.fonts.ready');
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 500 });
    await new Promise(resolve => setTimeout(resolve, 250));
    const logo = await evaluate('(()=>{const el=document.querySelector("header span[style*=mask]");const rect=el.getBoundingClientRect();return {mask:getComputedStyle(el).maskImage,width:rect.width,height:rect.height,overflow:document.documentElement.scrollWidth>innerWidth}})()');
    assert(logo.mask.includes('/kaban-symbol-small.svg'));
    assert.equal(logo.width, 28);
    assert.equal(logo.height, 28);
    assert.equal(logo.overflow, false);
    const capture = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(new URL(`./baulito-${name}.png`, import.meta.url), Buffer.from(capture.data, 'base64'));
    console.log(JSON.stringify({ name, ...logo }));
  }
} finally {
  await call('Browser.close');
  socket.close();
}
