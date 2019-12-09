const record = require('node-puppeteer-apng');
const fs = require('fs-extra');

void async function () {
  const buffer = await record(`file://${process.cwd()}/../../index.html`);
  await fs.writeFile('screencast.png', buffer);
}()
