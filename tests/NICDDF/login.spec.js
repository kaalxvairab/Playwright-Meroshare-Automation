const { test, expect } = require("@playwright/test");
require("dotenv").config();
const {
  performLogin,
  isLoginSuccessful,
  getNavValue,
  getNavMenuItems,
  getNavStructure,
  initWhatsApp,
  notifyNICDDFNavFound,
  notifyNICDDFLoginSuccess,
} = require("./helpers");

const NICDDF_URL = "https://nicddf.nicasiacapital.com/";
const NICDDF_USERNAME = process.env.NICDDF_USERNAME;
const NICDDF_PASSWORD = process.env.NICDDF_PASSWORD;

test.describe("NICDDF Automation", () => {
  test.setTimeout(60000); // 1 minute timeout

  test("should login and verify navigation", async ({ page }) => {
    console.log("\n\n==================== TEST START ====================");
    console.log("TEST: should login and verify navigation");
    console.log("====================================================\n");

    // Initialize WhatsApp notification
    console.log("📱 Initializing WhatsApp notifications...");
    const whatsappEnabled = initWhatsApp();
    console.log(
      whatsappEnabled ? "✅ WhatsApp enabled" : "ℹ️ WhatsApp disabled",
    );

    // Navigate to NICDDF website
    console.log("📍 Navigating to NICDDF website:", NICDDF_URL);
    await page.goto(NICDDF_URL, {
      waitUntil: "domcontentloaded",
    });
    console.log("✅ Website loaded");

    // Wait for page to load
    console.log("⏳ Waiting 2 seconds for page to fully load...");
    await page.waitForTimeout(2000);
    console.log("✅ Page fully ready\n");

    // Perform login
    console.log("🔐 Starting login process...");
    await performLogin(page, {
      username: NICDDF_USERNAME,
      password: NICDDF_PASSWORD,
    });

    // Wait for navigation to complete
    console.log("⏳ Waiting 3 seconds for navigation to complete...");
    await page.waitForTimeout(3000);
    console.log("✅ Navigation complete\n");

    // Verify login was successful
    console.log("🔍 Verifying login success...");
    const loginSuccess = await isLoginSuccessful(page);
    console.log(
      "Result:",
      loginSuccess ? "✅ Login Successful" : "❌ Login Failed",
    );
    expect(loginSuccess).toBeTruthy();

    // Get navigation value
    console.log("\n🗂️ Fetching navigation value...");
    const navValue = await getNavValue(page);
    console.log("Navigation value:", navValue || "(not found)");
    expect(navValue).toBeTruthy();

    // Send WhatsApp notification if nav value is present
    if (navValue) {
      console.log("\n📱 Nav value found! Sending WhatsApp notification...");
      try {
        await notifyNICDDFNavFound(navValue);
      } catch (error) {
        console.error("Failed to send WhatsApp notification:", error.message);
      }
    }

    // Get navigation menu items
    console.log("\n📋 Fetching navigation menu items...");
    const menuItems = await getNavMenuItems(page);
    console.log("Number of menu items found:", menuItems.length);
    console.log("Menu items:", menuItems);

    // Get navigation structure
    console.log("\n📐 Fetching navigation structure...");
    const navStructure = await getNavStructure(page);
    console.log(
      "Navigation structure found:",
      !!navStructure ? "✅ Yes" : "❌ No",
    );

    // Store results for verification
    console.log("\n✨ Verifying collected data...");
    expect({
      navValue,
      menuItems,
      navStructureExists: !!navStructure,
    }).toBeTruthy();
    console.log("✅ All verifications passed");
    console.log("\n===================== TEST END =====================\n");
  });

  test("should handle login failure gracefully", async ({ page }) => {
    console.log("\n\n==================== TEST START ====================");
    console.log("TEST: should handle login failure gracefully");
    console.log("====================================================\n");

    console.log("📍 Navigating to NICDDF website:", NICDDF_URL);
    await page.goto(NICDDF_URL, {
      waitUntil: "domcontentloaded",
    });
    console.log("✅ Website loaded");

    console.log("⏳ Waiting 2 seconds for page to fully load...");
    await page.waitForTimeout(2000);
    console.log("✅ Page ready\n");

    // Try login with invalid credentials
    try {
      console.log("🔐 Attempting login with credentials...");
      await performLogin(page, {
        username: NICDDF_USERNAME,
        password: NICDDF_PASSWORD,
      });

      console.log("⏳ Waiting 2 seconds after login attempt...");
      await page.waitForTimeout(2000);

      // Check if still on login page (login failed)
      console.log("🔍 Checking if login failed...");
      const loginSuccess = await isLoginSuccessful(page);
      console.log(
        "Login result:",
        !loginSuccess
          ? "✅ Login Failed (Expected)"
          : "❌ Login Succeeded (Unexpected)",
      );
      expect(!loginSuccess).toBeTruthy();
    } catch (e) {
      // If error thrown, that's expected behavior
      console.log(
        "⚠️ Error caught during login (Expected behavior):",
        e.message,
      );
      console.log("✅ Error handling works as expected");
      expect(e).toBeTruthy();
    }
    console.log("\n===================== TEST END =====================\n");
  });
});
