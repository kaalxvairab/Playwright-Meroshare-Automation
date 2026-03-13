/**
 * WhatsApp helper functions for notifications via CallMeBot WhatsApp API
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

  const endpoint = config.endpoint || process.env.WHATSAPP_CALLMEBOT_URL;
  const phone = config.phone || process.env.WHATSAPP_TO;
  const apiKey = config.apiKey || process.env.WHATSAPP_CALLMEBOT_API_KEY;

  if (!phone || !apiKey) {
    console.error(
      "WhatsApp is enabled but missing CallMeBot configuration (WHATSAPP_TO and WHATSAPP_CALLMEBOT_API_KEY).",
    );
    whatsappConfig = { enabled: false };
    return false;
  }

  whatsappConfig = {
    enabled: true,
    endpoint,
    phone: String(phone).replace(/\D/g, ""),
    apiKey,
  };

  return true;
}

function formatForWhatsApp(message) {
  return String(message || "")
    .replace(/\*/g, "")
    .replace(/_/g, "")
    .replace(/`/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function splitWhatsAppMessage(message, chunkSize = 900) {
  const clean = formatForWhatsApp(message);

  if (clean.length <= chunkSize) {
    return [clean];
  }

  const chunks = [];
  let current = "";
  const lines = clean.split("\n");

  for (const line of lines) {
    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length <= chunkSize) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = "";
    }

    if (line.length <= chunkSize) {
      current = line;
      continue;
    }

    for (let i = 0; i < line.length; i += chunkSize) {
      chunks.push(line.slice(i, i + chunkSize));
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

async function sendViaCallMeBot(message) {
  const endpoint = String(whatsappConfig.endpoint || "").trim();
  const baseUrl = endpoint.includes("whatsapp.php")
    ? endpoint
    : `${endpoint.replace(/\/$/, "")}/whatsapp.php`;

  const query = new URLSearchParams({
    phone: whatsappConfig.phone,
    text: message,
    apikey: whatsappConfig.apiKey,
  });

  const url = `${baseUrl}?${query.toString()}`;
  const response = await fetch(url, { method: "GET" });

  const rawBody = await response.text();
  const body = rawBody.trim();
  const bodyLower = body.toLowerCase();
  const hasOutageSignal =
    bodyLower.includes("service is down") || bodyLower.includes("(410)");
  const hasFailureSignal =
    hasOutageSignal ||
    bodyLower.includes("error") ||
    bodyLower.includes("invalid") ||
    bodyLower.includes("forbidden") ||
    bodyLower.includes("unauthorized");
  const hasSuccessSignal =
    bodyLower.includes("sent") ||
    bodyLower.includes("message to:") ||
    bodyLower.includes("text to send:") ||
    bodyLower.includes("queued");

  if (hasOutageSignal) {
    throw new Error(
      `CallMeBot service outage detected (${response.status}): ${body || "No response body"}`,
    );
  }

  if (!response.ok || hasFailureSignal || !hasSuccessSignal) {
    throw new Error(
      `CallMeBot send failed (${response.status}): ${body || "No response body"}`,
    );
  }
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

  try {
    const chunks = splitWhatsAppMessage(message);

    for (const chunk of chunks) {
      await sendViaCallMeBot(chunk);
    }

    console.log(`✉️ WhatsApp notification sent successfully`);
  } catch (error) {
    console.error("❌ Failed to send WhatsApp message:", error.message);
  }
}

/**
 * Notify when login is successful
 * @param {string} navValue
 * @param {Array} menuItems
 */
async function notifyNICDDFLoginSuccess(navValue, menuItems = []) {
  const message = `✅ NICDDF Login Successful

Navigation Value: ${navValue || "N/A"}

Menu Items (${menuItems.length}):
${menuItems.join(", ") || "None found"}

Time: ${new Date().toLocaleString()}`;

  await sendWhatsAppText(message);
}

/**
 * Notify when nav value is found
 * @param {string} navValue
 */
async function notifyNICDDFNavFound(navValue) {
  const message = `${navValue}\n\nTime: ${new Date().toLocaleString()}`;

  await sendWhatsAppText(message);
}

/**
 * Notify when login fails
 * @param {string} error
 */
async function notifyNICDDFLoginFailed(error = "") {
  const message = `❌ NICDDF Login Failed

Error: ${error || "Unknown error"}

Time: ${new Date().toLocaleString()}`;

  await sendWhatsAppText(message);
}

module.exports = {
  initWhatsApp,
  sendWhatsAppText,
  notifyNICDDFLoginSuccess,
  notifyNICDDFNavFound,
  notifyNICDDFLoginFailed,
  formatForWhatsApp,
};
