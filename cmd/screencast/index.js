const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const apng = require('node-apng');
const jimp = require('jimp');

void async function () {
  await recordUsingTracing();
  await recordUsingScreenshot();
  await recordUsingScreencast();
}()

async function recordUsingTracing() {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 600, height: 600 } });
  const [page] = await browser.pages();
  await page.goto(`file://${process.cwd()}/../../index.html`);
  await page.tracing.start({ screenshots: true });
  await page.waitFor(1000);
  const buffer = await page.tracing.stop();
  await browser.close();
  const trace = JSON.parse(await String(buffer));
  const buffers = [];
  const cuts = [];
  const timestamp = Date.now();
  for (const event of trace.traceEvents) {
    if (event.name === 'Screenshot') {
      const jpgBuffer = Buffer.from(event.args.snapshot, 'base64');
      const image = await jimp.read(jpgBuffer);
      const pngBuffer = await image.getBufferAsync('image/png');
      buffers.push(pngBuffer);
      cuts.push(Date.now());
    }
  }

  // Drop the first frame because it always has wrong dimensions
  buffers.shift(0);
  cuts.shift(0);
  await fs.writeFile('screencast-tracing.png', makeApng(buffers, cuts, timestamp));
}

async function recordUsingScreenshot() {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 600, height: 500 } });
  const [page] = await browser.pages();
  await page.goto(`file://${process.cwd()}/../../index.html`);
  const timestamp = Date.now();
  const buffers = [];
  const cuts = [];
  do {
    buffers.push(await page.screenshot());
    cuts.push(Date.now());
  } while (Date.now() - timestamp < 6 * 1000);
  await browser.close();
  await fs.writeFile('screencast-screenshot.png', makeApng(buffers, cuts, timestamp));
}

async function recordUsingScreencast() {
  // TODO: Force the window to the right size because the screencast takes the whole window area not just the viewport
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 600, height: 500 } });
  const [page] = await browser.pages();
  await page.goto(`file://${process.cwd()}/../../index.html`);
  const session = await page.target().createCDPSession();
  await session.send('Page.startScreencast');
  const buffers = [];
  const cuts = [];
  const timestamp = Date.now();
  session.on('Page.screencastFrame', event => {
    const buffer = Buffer.from(event.data, 'base64');
    buffers.push(buffer);
    cuts.push(Date.now());
  });
  await page.waitFor(3000);
  await session.send('Page.stopScreencast');
  await browser.close();
  // Drop the first frame because it always has wrong dimensions
  buffers.shift(0);
  cuts.shift(0);
  await fs.writeFile('screencast-screencast.png', makeApng(buffers, cuts, timestamp));
}

function makeApng(buffers, cuts, timestamp) {
  const delays = cuts.reduce((a, c, i) => { a.push(c - (cuts[i - 1] || timestamp)); return a; }, []);
  return apng(buffers, index => ({ numerator: 1, denominator: 1000 / delays[index] }));
}
