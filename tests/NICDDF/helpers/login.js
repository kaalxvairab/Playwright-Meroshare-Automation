/**
 * Login-related helper functions for NICDDF automation
 */

const { waitForPageReady, isElementVisible } = require("./common");

/**
 * Fill login form with username and password
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.username - Username to fill
 * @param {string} credentials.password - Password to fill
 */
async function fillLoginForm(page, { username, password }) {
  console.log("📝 fillLoginForm: Waiting for login form to be ready...");
  // Wait for form to be ready
  await waitForPageReady(
    page,
    ['input[type="text"]', 'input[type="password"]'],
    10000,
  );
  await page.waitForTimeout(500);

  console.log("📝 fillLoginForm: Looking for username field...");
  // Try different selectors for username field
  const usernameSelectors = [
    'input[type="text"]',
    'input[name*="username" i]',
    'input[id*="username" i]',
    'input[placeholder*="username" i]',
    'input[placeholder*="user" i]',
    "input.form-control:first-of-type",
  ];

  let usernameFilled = false;
  for (const selector of usernameSelectors) {
    try {
      const field = page.locator(selector).first();
      if (await field.isVisible({ timeout: 1000 })) {
        console.log(`✅ Username field found with selector: ${selector}`);
        await field.clear();
        await field.fill(username);
        console.log("✅ Username filled successfully");
        usernameFilled = true;
        break;
      }
    } catch (e) {
      console.log(`❌ Username selector failed: ${selector}`);
      continue;
    }
  }

  if (!usernameFilled) {
    console.error("❌ Could not find username field");
    throw new Error("Could not find username field");
  }

  console.log("📝 fillLoginForm: Looking for password field...");
  // Try different selectors for password field
  const passwordSelectors = [
    'input[type="password"]',
    'input[name*="password" i]',
    'input[id*="password" i]',
    'input[placeholder*="password" i]',
    "input.form-control:last-of-type",
  ];

  let passwordFilled = false;
  for (const selector of passwordSelectors) {
    try {
      const field = page.locator(selector).first();
      if (await field.isVisible({ timeout: 1000 })) {
        console.log(`✅ Password field found with selector: ${selector}`);
        await field.clear();
        await field.fill(password);
        console.log("✅ Password filled successfully");
        passwordFilled = true;
        break;
      }
    } catch (e) {
      console.log(`❌ Password selector failed: ${selector}`);
      continue;
    }
  }

  if (!passwordFilled) {
    console.error("❌ Could not find password field");
    throw new Error("Could not find password field");
  }

  console.log("✅ Form filled with credentials");
  return { usernameFilled, passwordFilled };
}

/**
 * Navigate to login button on landing page and click it
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function navigateToLoginButton(page) {
  console.log(
    "🔍 navigateToLoginButton: Searching for login button on landing page...",
  );
  const loginButtonSelectors = [
    'button:has-text("Login")',
    'button:has-text("Log In")',
    'button:has-text("Sign In")',
    'button:has-text("LOGIN")',
    'a:has-text("Login")',
    'a:has-text("Log In")',
    '[class*="login"] button',
    'button[id*="login"]',
    'a[href*="login"]',
  ];

  for (const selector of loginButtonSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        // Scroll to the button
        await button.scrollIntoViewIfNeeded();
        console.log(`✅ Login button found with selector: ${selector}`);
        return button;
      }
    } catch (e) {
      console.log(`❌ Selector attempt failed: ${selector}`);
      continue;
    }
  }

  console.error("❌ Login button not found on the landing page");
  throw new Error("Login button not found on the landing page");
}

/**
 * Click login button
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function clickLoginButton(page) {
  console.log("🔘 clickLoginButton: Searching for submit button...");
  const loginButtonSelectors = [
    'button[type="submit"]',
    'button:has-text("Login")',
    'button:has-text("Log In")',
    'button:has-text("Sign in")',
    'button:has-text("SignIn")',
    'button:has-text("LOGIN")',
    'input[type="submit"]',
    "button.btn-primary",
    "button.btn-login",
    "button.login-btn",
    'button[class*="submit"]',
    'button[id*="submit"]',
    'button[class*="login"]',
    '[role="button"]:has-text("Login")',
  ];

  for (const selector of loginButtonSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 })) {
        console.log(`✅ Submit button found with selector: ${selector}`);
        await button.click();
        console.log("✅ Submit button clicked");
        return true;
      }
    } catch (e) {
      console.log(`❌ Selector attempt failed: ${selector}`);
      continue;
    }
  }

  console.error("❌ Could not find login button");
  throw new Error("Could not find login button");
}

/**
 * Perform complete login flow
 * Flow: Landing Page > Click Login Button > Navigate to Login Page > Enter Credentials > Submit
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.username - Username
 * @param {string} credentials.password - Password
 */
async function performLogin(page, { username, password }) {
  try {
    console.log("\n========== STARTING LOGIN FLOW ==========");
    console.log("🚀 Step 1: Navigating to login button on landing page...");
    // Step 1: Find and click login button on landing page
    const loginButton = await navigateToLoginButton(page);
    console.log("🚀 Step 2: Clicking login button on landing page...");
    await loginButton.click();

    // Step 2: Wait for navigation to login page
    console.log("🚀 Step 3: Waiting for navigation to login page...");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);
    console.log("✅ Successfully navigated to login page");

    // Step 3: Fill in credentials on the new login page
    console.log("🚀 Step 4: Filling login form with credentials...");
    await fillLoginForm(page, { username, password });

    // Step 4: Click submit button
    console.log("🚀 Step 5: Clicking submit button...");
    await clickLoginButton(page);

    // Wait for login to complete
    console.log("🚀 Step 6: Waiting for login to complete...");
    await page.waitForTimeout(2000);
    console.log("✅ Login flow completed successfully");
    console.log("========== LOGIN FLOW FINISHED ==========\n");
  } catch (error) {
    console.error("❌ Login failed:", error.message);
    console.error("========== LOGIN FLOW FAILED ==========\n");
    throw error;
  }
}

/**
 * Check if login was successful
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function isLoginSuccessful(page) {
  console.log("✔️ isLoginSuccessful: Checking if login was successful...");
  try {
    // Check if we're no longer on login page and dashboard/main page is loaded
    const dashboardSelectors = [
      "nav",
      '[class*="dashboard"]',
      '[class*="sidebar"]',
      '[class*="navbar"]',
      '[role="navigation"]',
    ];

    for (const selector of dashboardSelectors) {
      if (await isElementVisible(page, selector, 2000)) {
        console.log(`✅ Dashboard element found: ${selector}`);
        console.log("✅ Login successful - Dashboard loaded");
        return true;
      }
    }

    // Fallback: check if URL changed from login
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    const success = !currentUrl.includes("login");
    if (success) {
      console.log("✅ Login successful - URL changed from login page");
    } else {
      console.log("❌ Still on login page");
    }
    return success;
  } catch (e) {
    console.error("❌ Error checking login success:", e.message);
    return false;
  }
}

module.exports = {
  fillLoginForm,
  clickLoginButton,
  navigateToLoginButton,
  performLogin,
  isLoginSuccessful,
};
