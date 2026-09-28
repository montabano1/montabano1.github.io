// Renders resume/resume.html to public/resume.pdf (headless Chromium).
//   node scripts/resume.mjs [output.pdf] [source.html]
import { chromium } from '@playwright/test'
import { fileURLToPath } from 'node:url'

// Optional second argument renders a different source file (e.g. a design option).
const source = process.argv[3] ? new URL(`file://${process.argv[3].startsWith('/') ? '' : process.cwd() + '/'}${process.argv[3]}`) : new URL('../resume/resume.html', import.meta.url)
// Optional first argument writes elsewhere, e.g. a draft for review.
const output = process.argv[2] ?? fileURLToPath(new URL('../public/resume.pdf', import.meta.url))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto(source.href, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
const pages = await page.evaluate(() => Math.ceil(document.body.scrollHeight / (11 * 96)))
await page.pdf({ path: output, format: 'Letter', printBackground: true, preferCSSPageSize: true })
await browser.close()
console.log(`wrote ${output} (${pages} page${pages === 1 ? '' : 's'} of content)`)
