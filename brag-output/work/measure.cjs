const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + __dirname + '/video.html');
  await p.evaluate(async () => { await document.fonts.ready; });
  const out={};
  for (const [t,name,sel] of [[7.3,'send','#send'],[9.0,'qr1','#qr .qbtn'],[11.6,'qr1b','#qr .qbtn'],[13.6,'qr1c','#qr .qbtn']]) {
    await p.evaluate(t => window.render(t), t);
    out[name]=await p.evaluate(sel => { const s=document.getElementById('screen').getBoundingClientRect();
      const e=document.querySelector(sel).getBoundingClientRect(); return [Math.round(e.x-s.x+e.width/2),Math.round(e.y-s.y+e.height/2)];}, sel);
  }
  console.log(JSON.stringify(out)); await b.close();
})();
