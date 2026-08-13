import { chromium } from '@playwright/test'

const base = process.env.BASE ?? 'http://localhost:5199'

const browser = await chromium.launch({
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto(base)
await page.waitForTimeout(9000)
await page.screenshot({ path: 'public/og.png', animations: 'disabled', timeout: 60000 })
await browser.close()
console.log('wrote public/og.png — convert to og.jpg with: ffmpeg -y -i public/og.png -q:v 4 public/og.jpg && rm public/og.png')
