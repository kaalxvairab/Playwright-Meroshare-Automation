/**
 * Common helper functions for NICDDF automation
 */

/**
 * Wait for page to be ready with specific elements visible
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string[]} selectors - Array of selectors to wait for
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForPageReady(page, selectors = [], timeout = 10000) {
  try {
    // Wait for page load state
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});

    // Wait for specific selectors if provided
    if (selectors && selectors.length > 0) {
      for (const selector of selectors) {
        try {
          await page
            .waitForSelector(selector, { timeout: Math.min(timeout, 5000) })
            .catch(() => {});
        } catch (e) {
          // Continue if selector not found
        }
      }
    }

    return true;
  } catch (e) {
    console.warn("Page ready wait timeout:", e.message);
    return true; // Continue anyway
  }
}

/**
 * Check if element is visible
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - Element selector
 * @param {number} timeout - Timeout in milliseconds
 */
async function isElementVisible(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return await page.locator(selector).first().isVisible();
  } catch (e) {
    return false;
  }
}

/**
 * Get text content from element
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - Element selector
 */
async function getElementText(page, selector) {
  try {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 2000 })) {
      return await element.textContent();
    }
    return null;
  } catch (e) {
    return null;
  }
}

module.exports = {
  waitForPageReady,
  isElementVisible,
  getElementText,
};
