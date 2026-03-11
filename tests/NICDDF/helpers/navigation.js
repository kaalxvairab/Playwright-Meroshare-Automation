/**
 * Navigation-related helper functions for NICDDF automation
 */

const { getElementText, isElementVisible } = require("./common");

/**
 * Get navigation value/text after login
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function getNavValue(page) {
  const navSelectors = [
    "nav",
    '[role="navigation"]',
    "header nav",
    '.[class*="navbar"]',
    '[class*="nav-bar"]',
    '[class*="navigation"]',
  ];

  for (const selector of navSelectors) {
    try {
      if (await isElementVisible(page, selector, 2000)) {
        const navText = await getElementText(page, selector);
        if (navText && navText.trim()) {
          return navText.trim();
        }
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}

/**
 * Get all navigation menu items
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function getNavMenuItems(page) {
  const menuItemSelectors = [
    "nav a",
    '[role="navigation"] a',
    'nav [role="menuitem"]',
    "nav li",
    ".navbar a",
    '[class*="menu"] a',
    '[class*="nav"] a',
  ];

  const menuItems = [];

  for (const selector of menuItemSelectors) {
    try {
      const items = await page.locator(selector).all();
      for (const item of items) {
        try {
          if (await item.isVisible({ timeout: 1000 })) {
            const text = await item.textContent();
            if (text && text.trim()) {
              menuItems.push(text.trim());
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (menuItems.length > 0) {
        return menuItems;
      }
    } catch (e) {
      continue;
    }
  }

  return menuItems;
}

/**
 * Get navigation structure/HTML
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function getNavStructure(page) {
  const navSelectors = [
    "nav",
    '[role="navigation"]',
    "header nav",
    '.[class*="navbar"]',
    '[class*="nav-bar"]',
  ];

  for (const selector of navSelectors) {
    try {
      if (await isElementVisible(page, selector, 2000)) {
        const navElement = page.locator(selector).first();
        const html = await navElement.innerHTML();
        return html;
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}

module.exports = {
  getNavValue,
  getNavMenuItems,
  getNavStructure,
};
