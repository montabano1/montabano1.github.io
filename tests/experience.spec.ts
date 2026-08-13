import { expect, test } from '@playwright/test'

test('isolates a résumé sequence and resumes orbit', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')
  await expect(page.getByRole('heading', { name: /This is what/i })).toBeVisible()

  await expect(page.getByRole('link', { name: /View résumé/i })).toHaveAttribute(
    'href',
    '/resume.pdf',
  )

  const sequenceButtons = page.getByRole('navigation', {
    name: 'Explore résumé sequences',
  }).getByRole('button')
  await expect(sequenceButtons).toHaveCount(4)

  await page.getByRole('button', { name: /Experience/i }).click()
  await expect(page.getByRole('heading', { name: 'Leading account opening' })).toBeVisible()
  await expect(page).toHaveURL(/#experience-capital-one$/)

  await page.keyboard.press('Escape')
  await expect(page).not.toHaveURL(/#experience-capital-one$/)
  await expect(page.getByRole('heading', { name: 'Leading account opening' })).toBeHidden({
    timeout: 10_000,
  })
  expect(errors).toEqual([])
})

test('keeps contact reachable without interacting with WebGL', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Contact/i }).click()
  await expect(page.getByRole('heading', { name: 'The full picture' })).toBeVisible()
  await page.getByRole('button', { name: /Next/ }).click()
  await expect(page.getByRole('heading', { name: 'Build together' })).toBeVisible({
    timeout: 10_000,
  })
  await page.getByRole('button', { name: /Next/ }).click()
  await expect(page.getByRole('heading', { name: 'Send a signal' })).toBeVisible({
    timeout: 10_000,
  })
  await expect(page.getByRole('link', { name: 'Send a signal' })).toHaveAttribute(
    'href',
    'mailto:montabano1@gmail.com',
  )
})
