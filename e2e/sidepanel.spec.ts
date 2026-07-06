import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXT_PATH = path.resolve(__dirname, '..', 'dist')

let context: BrowserContext
let extId: string

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext('', {
    channel: 'chrome',
    headless: false,
    args: [
      `--disable-extensions-except=${EXT_PATH}`,
      `--load-extension=${EXT_PATH}`,
      '--no-sandbox',
    ],
  })
  let [sw] = context.serviceWorkers()
  if (!sw) sw = await context.waitForEvent('serviceworker')
  extId = new URL(sw.url()).host
})

test.afterAll(async () => {
  await context.close()
})

const panelUrl = () => `chrome-extension://${extId}/src/sidepanel/index.html`

test('shows empty state', async () => {
  const page = await context.newPage()
  await page.goto(panelUrl())
  await expect(page.getByText('No palette yet')).toBeVisible({ timeout: 15000 })
  await page.close()
})

test.describe('after upload', () => {
  const fixture = path.resolve(__dirname, '..', 'public', 'icons', 'icon128.png')
  let sharedPage: Page

  test.beforeAll(async () => {
    sharedPage = await context.newPage()
    await sharedPage.goto(panelUrl())
    await sharedPage.setInputFiles('input[type="file"]', fixture)
    // Wait for worker to finish and first swatch to appear before any test runs.
    await expect(
      sharedPage.locator('button[title^="Click to copy"]').first(),
    ).toBeVisible({ timeout: 15000 })
  })

  test.afterAll(async () => {
    await sharedPage.close()
  })

  test('extracts a palette from an uploaded image', async () => {
    await expect(sharedPage.getByText('Palette', { exact: true })).toBeVisible({ timeout: 15000 })
    // nth(2) is the third swatch — implicitly asserts count >= 3.
    await expect(
      sharedPage.locator('button[title^="Click to copy"]').nth(2),
    ).toBeVisible({ timeout: 15000 })
    await expect(sharedPage.getByText(/%$/).first()).toBeVisible({ timeout: 15000 })
  })

  test('harmony tab renders colors', async () => {
    await sharedPage.getByRole('button', { name: 'Harmony' }).click()
    // Harmony panel emits color buttons titled "Copy #xxxxxx".
    await expect(
      sharedPage.locator('button[title^="Copy #"]').nth(2),
    ).toBeVisible({ timeout: 15000 })
  })

  test('contrast tab shows a ratio', async () => {
    await sharedPage.getByRole('button', { name: 'Contrast' }).click()
    await expect(sharedPage.getByText(':1')).toBeVisible({ timeout: 15000 })
    await expect(sharedPage.getByText(/\d+\.\d{2}/).first()).toBeVisible({ timeout: 15000 })
  })
})
