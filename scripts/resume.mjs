// Renders resume/resume.html to public/resume.pdf (headless Chromium).
//   node scripts/resume.mjs
import { chromium } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const source = new URL('../resume/resume.html', import.meta.url)
const output = fileURLToPath(new URL('../public/resume.pdf', import.meta.url))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto(source.href, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
const pages = await page.evaluate(() => Math.ceil(document.body.scrollHeight / (11 * 96)))
await page.pdf({ path: output, format: 'Letter', printBackground: true, preferCSSPageSize: true })
await browser.close()
console.log(`wrote ${output} (${pages} page${pages === 1 ? '' : 's'} of content)`)
