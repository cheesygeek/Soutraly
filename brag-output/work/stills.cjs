const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const times = process.argv.slice(2).map(Number);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.join(__dirname, 'video.html'));
  await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode())); });
  for (const t of times) { await p.evaluate(t => window.render(t), t);
    await p.screenshot({ path: path.join(__dirname, 'stills', `t${t.toFixed(2)}.jpg`), type: 'jpeg', quality: 80 }); }
  await b.close();
})();
