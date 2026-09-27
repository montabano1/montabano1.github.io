import { expect, test } from '@playwright/test'

test('helix connectors highlight, open, and close panels', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')

  const renderer = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2')
    const info = gl?.getExtension('WEBGL_debug_renderer_info')
    return info ? String(gl!.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
  })
  test.skip(!renderer || /swiftshader|llvmpipe|software/i.test(renderer), 'needs hardware WebGL')

  await expect(page.locator('.molecular-canvas.is-ready')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.helix-placeholder')).toHaveClass(/is-hidden/)

  // Pick a connector whose hit target sits on screen, clear of the hero copy.
  const rows = page.locator('.connector-row')
  await expect(rows).toHaveCount(14)
  await page.waitForTimeout(1500)
  const viewport = page.viewportSize()!
  let target = -1
  for (let index = 0; index < 14; index += 1) {
    const box = await rows.nth(index).boundingBox()
    if (!box) continue
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    if (x > 40 && x < viewport.width * 0.4 && y > 80 && y < viewport.height - 80) {
      target = index
      break
    }
  }
  expect(target).toBeGreaterThanOrEqual(0)
  const row = rows.nth(target)
  const title = (await row.getAttribute('aria-label'))!.replace(/^Open /, '')

  // The helix keeps turning, so drive the tracked target directly: keyboard
  // focus runs the same highlight path as hovering it.
  await row.focus()
  await expect(page.locator('.sequence-nav button.is-highlighted')).toHaveCount(1)
  await row.dispatchEvent('click')
  await expect(page.getByRole('dialog', { name: /details/ })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: /details/ })).toBeHidden({ timeout: 10_000 })
  await expect(page.locator('.molecular-canvas.is-ready')).toBeVisible()
  expect(errors).toEqual([])
})
