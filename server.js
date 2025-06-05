const puppeteer = require('puppeteer');
const express = require('express')
const app = express()
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs')
const FormData = require('form-data');


const port = 3000;

app.get('/screenshot', async (req, res) => {
  const { url, selector, app_id, app_secret } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true ,args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage();
    await page.setViewport({width: 800,height:2000});
    const r_url = decodeURIComponent(url)
    await page.goto(r_url, { waitUntil: 'networkidle0' });

    let base64;

    const file = `${__dirname}/tmp/${uuidv4()}.png`

    if (selector) {
      await page.waitForSelector('#'+selector, { timeout: 10000 });
      const element = await page.$(selector);
      base64 = await element.screenshot({ path:file });
    } else {
      base64 = await page.screenshot({ path: file, fullPage: true });
    }

    const headers = {
      'Content-Type': 'application/json',
    };
    // 获取tenant_access_token
    const response = await axios.post('https://open.rwork.crc.com.cn/open-apis/auth/v3/tenant_access_token/internal',{
      app_id,
      app_secret
    },{
      headers
    })

    // console.log(response.data)

    // 设置access_token
    const tenant_access_token = response.data.tenant_access_token

    const form = new FormData();
    form.append('image', fs.createReadStream(file));
    form.append("image_type","message")
    const uploadResponse = await axios.post('https://open.rwork.crc.com.cn/open-apis/image/v4/put/',form,{
      headers:{
        ...form.getHeaders(), // 自动生成 boundary 和 Content-Type
        'Content-Type':'multipart/form-data',
        'Authorization': `Bearer ${tenant_access_token}`
      }
    })

    console.log(uploadResponse.data)
    const image_key = uploadResponse.data.data.image_key

    res.json({
      image_key
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
