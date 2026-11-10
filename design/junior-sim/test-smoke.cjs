// Smoke test: the folder URL without a slash, Junior's voice on, sound off, one command.
//   node design/junior-sim/test-smoke.cjs <playwright module path> <url without trailing slash>
const [pwPath, url] = process.argv.slice(2);
const { chromium } = require(pwPath);
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1024, height: 700 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(url);
  await p.waitForFunction(() => !document.getElementById('startbtn').disabled, null, { timeout: 60000 });
  console.log('url:', p.url());
  await p.click('#startbtn');
  await p.click('#voicebtn');
  await p.click('button[data-say="Junior, check that one"]');
  await p.click('#soundbtn');
  await new Promise(r => setTimeout(r, 1500));
  console.log('voice:', await p.getAttribute('#voicebtn', 'aria-pressed'), 'sound:', await p.getAttribute('#soundbtn', 'aria-pressed'), '| said:', await p.textContent('#said'));
  console.log('errors:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})();
