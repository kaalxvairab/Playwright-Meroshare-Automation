/**
 * WhatsApp helper functions for notifications via Twilio WhatsApp API
 */

let whatsappConfig = null;

/**
 * Initialize WhatsApp config
 * @param {Object} config
 * @returns {boolean} true when enabled and configured, false otherwise
 */
function initWhatsApp(config = {}) {
  const enabled =
    String(
      config.enabled ?? process.env.WHATSAPP_ENABLED ?? "false",
    ).toLowerCase() === "true";

  if (!enabled) {
    whatsappConfig = { enabled: false };
    return false;
  }

  const accountSid = config.accountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = config.authToken || process.env.TWILIO_AUTH_TOKEN;
  const from = config.from || process.env.TWILIO_WHATSAPP_FROM;
  const to = config.to || process.env.WHATSAPP_TO;

  if (!accountSid || !authToken || !from || !to) {
    console.error(
      "WhatsApp is enabled but missing Twilio configuration variables.",
    );
    whatsappConfig = { enabled: false };
    return false;
  }

  whatsappConfig = {
    enabled: true,
    accountSid,
    authToken,
    from,
    to,
  };

  return true;
}

function formatForWhatsApp(message) {
  return String(message || "")
    .replace(/\*/g, "")
    .replace(/_/g, "")
    .replace(/`/g, "")
    .trim();
}

/**
 * Send plain text message to WhatsApp
 * @param {string} message
 */
async function sendWhatsAppText(message) {
  if (!whatsappConfig) {
    initWhatsApp();
  }

  if (!whatsappConfig || !whatsappConfig.enabled) {
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${whatsappConfig.accountSid}/Messages.json`;
  const body = new URLSearchParams({
    From: whatsappConfig.from,
    To: whatsappConfig.to,
    Body: formatForWhatsApp(message),
  });

  const auth = Buffer.from(
    `${whatsappConfig.accountSid}:${whatsappConfig.authToken}`,
  ).toString("base64");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `WhatsApp send failed (${response.status}): ${errorText}`,
      );
    }

    console.log("WhatsApp notification sent successfully");
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error.message);
  }
}

async function notifyIPOStatusWhatsApp(status, details = "") {
  const emoji = status === "success" ? "✅" : status === "failed" ? "❌" : "⚠️";
  const message = `${emoji} IPO Application ${status.toUpperCase()}\n\n${details}\nTime: ${new Date().toLocaleString()}`;
  await sendWhatsAppText(message);
}

async function notifyErrorWhatsApp(error) {
  const message = `❌ Error Occurred\n\nError: ${error}\nTime: ${new Date().toLocaleString()}`;
  await sendWhatsAppText(message);
}

async function notifyIPONotFoundWhatsApp() {
  await sendWhatsAppText("ℹ️ No IPO Today 🤦‍♀️");
}

async function notifyIPOOpenForReviewWhatsApp(details) {
  let message = "🚀 IPO Open\n\n";

  if (details.companyName) {
    message += `Company: ${details.companyName}\n`;
  }
  if (
    details.shareValuePerUnit !== undefined &&
    details.shareValuePerUnit !== null
  ) {
    message += `Share Value Per Unit: ${details.shareValuePerUnit}\n`;
  }
  if (details.minUnit !== undefined && details.minUnit !== null) {
    message += `Min Unit: ${details.minUnit}\n`;
  }

  message += "\n⚠️ Not auto-applied\n";
  if (details.reason) {
    message += `${details.reason}\n`;
  }

  message += `\nTime: ${new Date().toLocaleString()}`;

  await sendWhatsAppText(message);
}

module.exports = {
  initWhatsApp,
  sendWhatsAppText,
  notifyIPOStatusWhatsApp,
  notifyErrorWhatsApp,
  notifyIPONotFoundWhatsApp,
  notifyIPOOpenForReviewWhatsApp,
  formatForWhatsApp,
};
