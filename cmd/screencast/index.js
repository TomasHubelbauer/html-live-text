const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const makeApng = require('node-apng');

void async function () {
  //await recordUsingTracing();
  await recordUsingScreenshot();
  //await recordUsingScreencast(); // https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-startScreencast + https://github.com/michaelshiel/puppeteer/commits/master + https://github.com/puppeteer/puppeteer/issues/478 + https://github.com/cretz/chrome-screen-rec-poc
}()

async function recordUsingTracing() {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 600, height: 600 } });
  const [page] = await browser.pages();
  await page.goto(`file://${process.cwd()}/../../index.html`);
  await page.tracing.start({ screenshots: true });
  await page.waitFor(1000);
  const buffer = await page.tracing.stop();
  await browser.close();

  // trace { traceEvents[] { pid, tid, ts, ph, cat, name, dur, s, id, tts, tdur, args }, metadata { … } }
  const trace = JSON.parse(await String(buffer));

  const snapshots = [];
  for (const event of trace.traceEvents) {
    if (event.name === 'Screenshot') {
      // TODO: Capture the timings to know how long to show each frame for
      snapshots.push(Buffer.from(event.args.snapshot, 'base64'));
    }
  }

  console.log(snapshots.length);
  // TODO: Flush the buffers to a GIF
}

async function recordUsingScreenshot() {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 600, height: 600 } });
  const [page] = await browser.pages();
  await page.goto(`file://${process.cwd()}/../../index.html`);
  const timestamp = Date.now();
  const buffers = [];
  do {
    // TODO: Capture the timing information to know how long to show each buffer for
    buffers.push(await page.screenshot());
  } while (Date.now() - timestamp < 6 * 1000);
  console.log(buffers.length);
  await browser.close();

  const buffer = makeApng(buffers);
  await fs.writeFile('cast.png', buffer);

  // TODO: Flush the buffers to a GIF
}
