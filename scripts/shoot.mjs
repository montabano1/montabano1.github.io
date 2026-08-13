import { chromium } from '@playwright/test'

const base = process.env.BASE ?? 'http://localhost:5199'
const outDir = process.env.OUT ?? 'test-results'
const shots = [
  { name: 'desktop', width: 1440, height: 810 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'mobile-se', width: 375, height: 667 },
]

const browser = await chromium.launch({
  headless: process.env.HEADED ? false : true,
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
})
for (const shot of shots) {
  const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } })
  await page.goto(base + (process.env.PATHNAME ?? '/'))
  await page.waitForTimeout(5500)
  await page.screenshot({
    path: `${outDir}/shot-${shot.name}.png`,
    animations: 'disabled',
    caret: 'hide',
    timeout: 60000,
  })
  if (process.env.OPEN_PANEL) {
    await page.getByRole('button', { name: /Selected work/i }).click()
    await page.waitForTimeout(2200)
    await page.screenshot({
      path: `${outDir}/shot-${shot.name}-panel.png`,
      animations: 'disabled',
      timeout: 60000,
    })
  }
  await page.close()
}
await browser.close()
console.log('done')
