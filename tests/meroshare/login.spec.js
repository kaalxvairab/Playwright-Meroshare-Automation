const { test } = require("@playwright/test");
require("dotenv").config();
const {
  performLogin,
  isLoginSuccessful,
  clickMyASBA,
  checkForApplyButton,
  clickApplyButton,
  clickShareRow,
  verifyShareDetails,
  goBackToMyASBA,
  fillIPOApplication,
  submitIPOApplication,
  checkApplicationStatus,
  initBot,
  notifyIPOStatus,
  notifyError,
  notifyIPONotFound,
  notifyIPOOpenForReview,
  initWhatsApp,
  notifyIPOStatusWhatsApp,
  notifyErrorWhatsApp,
  notifyIPONotFoundWhatsApp,
  notifyIPOOpenForReviewWhatsApp,
  // Retry utilities for high traffic scenarios
  navigateWithRetry,
  waitForElementWithRetry,
  retryWithBackoff,
} = require("./helpers");

test.describe("MeroShare IPO Automation", () => {
  test.setTimeout(300000); // Set test timeout to 5 minutes (increased for high traffic)

  test.beforeEach(async ({ page }) => {
    // Use retry-enabled navigation for high traffic scenarios
    const loginUrl = "https://meroshare.cdsc.com.np/#/login";

    await navigateWithRetry(page, loginUrl, {
      maxRetries: 5,
      timeout: 120000, // 2 minutes per attempt
      waitUntil: "domcontentloaded",
    });

    // Wait for login form elements with retry
    try {
      await waitForElementWithRetry(
        page,
        [
          "form",
          "input#username",
          "select2#selectBranch",
          'input[type="text"]',
        ],
        {
          timeout: 60000,
          maxRetries: 3,
          reloadOnFail: true,
        },
      );
    } catch (e) {
      console.log("Could not find login form elements, continuing anyway...");
      await page.waitForTimeout(2000);
    }
  });

  test("should check for IPO and auto-apply", async ({ page }) => {
    const username = process.env.MEROSHARE_USERNAME;
    const password = process.env.MEROSHARE_PASSWORD;
    const dp = process.env.MEROSHARE_DP_NP;
    const telegramEnabled =
      String(process.env.TELEGRAM_ENABLED ?? "false").toLowerCase() === "true";
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    const whatsappEnabled = initWhatsApp();
    const ipoBank = process.env.MEROSHARE_BANK;
    const ipoAccountNumber = process.env.MEROSHARE_P_ACCOUNT_NO;
    const ipoKitta = process.env.MEROSHARE_KITTA_N0;
    const ipoCrn = process.env.MEROSHARE_CRN_NO;

    if (!username || !password) {
      throw new Error(
        "MEROSHARE_USERNAME and MEROSHARE_PASSWORD must be set in .env file",
      );
    }

    // Initialize Telegram bot (but don't send any messages yet)
    if (telegramEnabled && telegramToken) {
      try {
        initBot(telegramToken);
        console.log("Telegram bot initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Telegram bot:", error.message);
      }
    } else if (!telegramEnabled) {
      console.log("Telegram notifications disabled via TELEGRAM_ENABLED");
    }

    // Track IPO details for final notification
    let ipoDetails = null;
    let finalStatus = "no_ipo"; // Possible: 'no_ipo', 'success', 'failed', 'needs_review'
    let failureReason = "";

    try {
      // Wait for login form
      try {
        await waitForElementWithRetry(
          page,
          ["form", "input#username", "select2#selectBranch"],
          { timeout: 30000, maxRetries: 2 },
        );
      } catch (e) {
        console.log("Login form elements not found, attempting to continue...");
      }
      await page.waitForTimeout(1000);

      // Login with retry for high traffic scenarios
      await retryWithBackoff(
        async () => {
          await performLogin(page, { username, password, dp });
        },
        {
          maxRetries: 3,
          initialDelay: 3000,
          onRetry: async (error, attempt) => {
            console.log(
              `Login attempt ${attempt} failed: ${error.message}. Retrying...`,
            );
            try {
              await page.reload({
                timeout: 60000,
                waitUntil: "domcontentloaded",
              });
              await page.waitForTimeout(2000);
            } catch (e) {
              console.log("Page reload failed, continuing...");
            }
          },
        },
      );

      await page.waitForTimeout(5000);

      const success = await isLoginSuccessful(page);
      if (!success) {
        let errorMessage = "Login failed";
        const errorText = await page
          .locator('.error, .alert-danger, [role="alert"]')
          .first()
          .textContent()
          .catch(() => null);
        if (errorText) {
          errorMessage = `Login failed: ${errorText.trim()}`;
        }

        // Clear sensitive fields before error
        try {
          await page
            .locator('input[type="password"], input[name*="password" i]')
            .evaluate((el) => (el.value = ""));
          await page
            .locator('input[name*="username" i], input[id*="username" i]')
            .evaluate((el) => (el.value = ""));
        } catch (e) {}

        throw new Error(errorMessage);
      }

      // Click My ASBA with retry
      await retryWithBackoff(
        async () => {
          await clickMyASBA(page);
        },
        {
          maxRetries: 3,
          initialDelay: 2000,
          onRetry: (error, attempt) => {
            console.log(`My ASBA click attempt ${attempt} failed. Retrying...`);
          },
        },
      );
      await page.waitForTimeout(5000);

      // Check for IPO with retry
      const applyInfo = await retryWithBackoff(
        async () => {
          const info = await checkForApplyButton(page);
          if (info.found || info.reason) {
            return info;
          }
          throw new Error("Page not fully loaded");
        },
        {
          maxRetries: 3,
          initialDelay: 3000,
          onRetry: async (error, attempt) => {
            console.log(
              `ASBA check attempt ${attempt} - page may still be loading...`,
            );
            await page.waitForTimeout(2000);
          },
        },
      );

      // No IPO available or already applied
      if (!applyInfo.found) {
        if (applyInfo.alreadyApplied) {
          console.log("IPO already applied for this account.");
          finalStatus = "already_applied";
          ipoDetails = applyInfo.ipoDetails;
        } else {
          console.log("No IPO available for application.");
          finalStatus = "no_ipo";
        }
      } else {
        // IPO found - proceed with application
        // Store IPO details
        ipoDetails = applyInfo.ipoDetails;

        // Verify share details
        const clickedRow = await clickShareRow(page, applyInfo);
        if (!clickedRow) {
          throw new Error("Could not click on share row to view details");
        }

        const verification = await verifyShareDetails(page, 100, 10);

        if (!verification.valid) {
          // Share needs manual review (price != 100 or min units != 10)
          finalStatus = "needs_review";
          failureReason = `IPO needs manual review: ${verification.reason}`;
          // Store verification values for notification
          if (ipoDetails) {
            ipoDetails.shareValuePerUnit = verification.shareValuePerUnit;
            ipoDetails.minUnit = verification.minUnit;
          }
          console.log(failureReason);
        } else {
          await goBackToMyASBA(page);
          await page.waitForTimeout(2000);

          const applyInfoRefresh = await checkForApplyButton(page);
          if (!applyInfoRefresh.found) {
            throw new Error("Could not find Apply button after verification");
          }

          // Only proceed with auto-apply if all required env vars are set
          if (!ipoBank || !ipoAccountNumber || !ipoKitta || !ipoCrn) {
            console.log(
              "Auto-apply disabled: Missing required environment variables (MEROSHARE_BANK, MEROSHARE_P_ACCOUNT_NO, MEROSHARE_KITTA_N0, MEROSHARE_CRN_NO)",
            );
            finalStatus = "needs_review";
            failureReason = "Auto-apply not configured. Please apply manually.";
          } else {
            // Attempt to fill and submit IPO application with retry
            let submitResult = null;
            await retryWithBackoff(
              async () => {
                await clickApplyButton(page, applyInfoRefresh);
                await page.waitForTimeout(3000);

                await fillIPOApplication(page, {
                  bank: ipoBank,
                  accountNumber: ipoAccountNumber,
                  kitta: ipoKitta,
                  crn: ipoCrn,
                });
                await page.waitForTimeout(2000);

                submitResult = await submitIPOApplication(page);
                if (!submitResult.clickedApply) {
                  throw new Error(
                    submitResult.error || "Failed to submit IPO application",
                  );
                }
                await page.waitForTimeout(3000);
              },
              {
                maxRetries: 2,
                initialDelay: 3000,
                onRetry: async (error, attempt) => {
                  console.log(
                    `IPO application attempt ${attempt} failed: ${error.message}. Retrying...`,
                  );
                  // Go back and try again
                  try {
                    await goBackToMyASBA(page);
                    await page.waitForTimeout(2000);
                  } catch (e) {
                    console.log("Could not go back, continuing...");
                  }
                },
              },
            );

            // Check final status - wait a bit longer for response
            await page.waitForTimeout(3000);

            if (!page.isClosed()) {
              const status = await checkApplicationStatus(page);
              if (status.success) {
                finalStatus = "success";
                console.log("IPO application submitted successfully!");
              } else {
                finalStatus = "failed";
                failureReason =
                  status.message ||
                  "Application submission failed - please verify manually";
              }
            } else {
              // Page closed during submission - DO NOT assume success, mark as unknown
              finalStatus = "unknown";
              failureReason =
                "Page closed unexpectedly. Please verify application status manually.";
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error during IPO automation: ${error.message}`);
      finalStatus = "failed";
      failureReason = error.message;

      // Check if page closed unexpectedly (might still have succeeded)
      if (
        error.message &&
        error.message.includes(
          "Target page, context or browser has been closed",
        )
      ) {
        finalStatus = "unknown";
        failureReason =
          "Page closed unexpectedly. IPO may or may not have been submitted.";
      }
    }

    // Send notifications based on final status (Telegram + WhatsApp)
    try {
      switch (finalStatus) {
        case "success": {
          const companyName = ipoDetails?.companyName || "IPO";
          const detailMessage = `✅ ${companyName} IPO application submitted successfully!`;

          if (telegramEnabled && telegramChatId && telegramToken) {
            await notifyIPOStatus(telegramChatId, "success", detailMessage);
          }
          if (whatsappEnabled) {
            await notifyIPOStatusWhatsApp("success", detailMessage);
          }
          break;
        }

        case "failed": {
          const detailMessage =
            `❌ Failed to auto-apply for IPO.\n\n` +
            `Please apply manually at https://meroshare.cdsc.com.np\n\n` +
            `We apologize for the inconvenience.`;

          if (telegramEnabled && telegramChatId && telegramToken) {
            await notifyError(telegramChatId, detailMessage);
          }
          if (whatsappEnabled) {
            await notifyErrorWhatsApp(detailMessage);
          }
          break;
        }

        case "needs_review": {
          const reviewPayload = {
            companyName: ipoDetails?.companyName || "Available IPO",
            shareValuePerUnit: ipoDetails?.shareValuePerUnit,
            minUnit: ipoDetails?.minUnit,
            reason: failureReason,
          };

          if (telegramEnabled && telegramChatId && telegramToken) {
            await notifyIPOOpenForReview(telegramChatId, reviewPayload);
          }
          if (whatsappEnabled) {
            await notifyIPOOpenForReviewWhatsApp(reviewPayload);
          }
          break;
        }

        case "unknown": {
          const detailMessage =
            `⚠️ IPO application status unknown.\n\n` +
            `${failureReason}\n\n` +
            `Please check your MeroShare account to verify if the application was submitted.`;

          if (telegramEnabled && telegramChatId && telegramToken) {
            await notifyError(telegramChatId, detailMessage);
          }
          if (whatsappEnabled) {
            await notifyErrorWhatsApp(detailMessage);
          }
          break;
        }

        case "already_applied": {
          const appliedCompany = ipoDetails?.companyName || "IPO";
          const detailMessage = `✅ ${appliedCompany} IPO already applied!\n\nYour application was previously submitted.`;

          if (telegramEnabled && telegramChatId && telegramToken) {
            await notifyIPOStatus(telegramChatId, "success", detailMessage);
          }
          if (whatsappEnabled) {
            await notifyIPOStatusWhatsApp("success", detailMessage);
          }
          break;
        }

        case "no_ipo":
          if (telegramEnabled && telegramChatId && telegramToken) {
            await notifyIPONotFound(telegramChatId);
          }
          if (whatsappEnabled) {
            await notifyIPONotFoundWhatsApp();
          }
          break;
      }
    } catch (notificationError) {
      console.error(
        `Failed to send notification: ${notificationError.message}`,
      );
    }

    // Throw error if failed (so test fails)
    if (finalStatus === "failed") {
      throw new Error(failureReason);
    }
  });
});
