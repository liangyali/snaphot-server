const puppeteer = require('puppeteer');
const express = require('express')
const app = express()

const port = 3000;

app.get('/screenshot', async (req, res) => {
    const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  let browser;
  try {
        browser = await puppeteer.launch({ headless: true ,args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage();
    await page.setViewport({width: 1980, height: 1024});
    await page.goto(url, { waitUntil: 'networkidle0' });
    let base64 = await page.screenshot({ encoding: 'base64', fullPage: true });
    res.json({
      data: 'data:image/png;base64,' + base64
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Screenshot failed', details: err.message });
  } finally {
    if (browser) await browser.close();
  }
})

app.listen(port, () => {
    console.log(`🚀 Screenshot API is running at http://localhost:${port}`);
});

