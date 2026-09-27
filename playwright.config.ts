import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    reducedMotion: 'reduce',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'desktop-chromium',
      testIgnore: /helix\.spec/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      testIgnore: /helix\.spec/,
      use: { ...devices['Pixel 7'] },
    },
    {
      // The 3D helix only runs on real graphics hardware; this project asks
      // Chromium for the GPU and skips itself where only software GL exists.
      name: 'desktop-gpu',
      testMatch: /helix\.spec/,
      use: {
        ...devices['Desktop Chrome'],
        reducedMotion: 'no-preference',
        launchOptions: { args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] },
      },
    },
  ],
})
