// Builds public/og.jpg — the 1200×630 card link previews show.
// 1. Captures the live helix from a running build (BASE, default the local preview).
// 2. Composes it with the name, role, and featured work in plain HTML.
//   node scripts/og.mjs            (needs `npx vite preview --port 5300` or BASE=...)
import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const base = process.env.BASE ?? 'http://127.0.0.1:5300'
const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
})

const site = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
await site.goto(base)
await site.waitForSelector('.molecular-canvas.is-ready', { timeout: 30000 })
await site.addStyleTag({ content: '.interface, .atmosphere { display: none !important; }' })
await site.waitForTimeout(2500)
const helix = await site.screenshot({ clip: { x: 40, y: 0, width: 520, height: 900 }, type: 'png' })

const projects = [
  ['PaddleScreens', 'court cameras and vision models at 8 clubs'],
  ['Beleeg', 'an AI league copilot that asks before it acts'],
  ['RecruitPlan', 'the recruiting model a top lacrosse club runs on'],
  ['Tutorius Math', '10,000+ first-year downloads on iOS'],
]

const card = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await card.setContent(`<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Manrope:wght@500;600;700&display=block" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; color: #f5f1e8; font-family: Manrope, sans-serif;
    background: radial-gradient(circle at 78% 18%, rgba(255,177,92,.14), transparent 40%),
                radial-gradient(circle at 18% 80%, rgba(98,230,210,.1), transparent 45%), #0a0d15; }
  .helix { position: absolute; left: -10px; top: -20px; height: 670px;
    mask-image: linear-gradient(90deg, #000 62%, transparent); -webkit-mask-image: linear-gradient(90deg, #000 62%, transparent); }
  .copy { position: absolute; left: 360px; right: 64px; top: 70px; }
  .kicker { color: #a9b6b1; font-size: 17px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  h1 { margin-top: 14px; font: 400 76px/0.95 Fraunces, serif; letter-spacing: -.04em; }
  .role { margin-top: 16px; color: #c3bbff; font: 400 30px/1.2 Fraunces, serif; }
  ul { list-style: none; padding: 0; margin-top: 34px; display: grid; gap: 13px; }
  li { display: flex; align-items: baseline; gap: 14px; font-size: 21px; color: #aebbb6; }
  li b { color: #ffb15c; font-weight: 700; min-width: 176px; }
  .url { position: absolute; right: 64px; bottom: 40px; color: #7f8e89; font-size: 18px; font-weight: 600; letter-spacing: .06em; }
</style></head><body>
  <img class="helix" src="data:image/png;base64,${helix.toString('base64')}">
  <div class="copy">
    <p class="kicker">Principal Engineer</p>
    <h1>Michael Montalbano</h1>
    <p class="role">AI and computer vision, taken end to end</p>
    <ul>${projects.map(([name, line]) => `<li><b>${name}</b><span>${line}</span></li>`).join('')}</ul>
  </div>
  <p class="url">michaelmontalbano.com</p>
</body></html>`)
await card.evaluate(() => document.fonts.ready)
await card.waitForTimeout(400)
await card.screenshot({ path: 'public/og.png' })
await browser.close()

execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', 'public/og.png', '-q:v', '3', 'public/og.jpg'])
fs.unlinkSync('public/og.png')
console.log('wrote public/og.jpg')
