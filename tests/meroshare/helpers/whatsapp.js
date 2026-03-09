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

  const provider = String(
    config.provider ?? process.env.WHATSAPP_PROVIDER ?? "callmebot",
  ).toLowerCase();
  const endpoint =
    config.endpoint ||
    process.env.WHATSAPP_ENDPOINT ||
    process.env.WWATSAPP_CALLMEBOT_URL ||
    "https://api.callmebot.com";
  const phone =
    config.phone || process.env.WHATSAPP_PHONE || process.env.WHATSAPP_TO;
  const apiKey =
    config.apiKey ||
    process.env.WHATSAPP_API_KEY ||
    process.env.WHATSAPP_CALLMEBOT_API_KEY;

  if (provider !== "callmebot") {
    console.error(
      `Unsupported WhatsApp provider: ${provider}. Supported provider: callmebot`,
    );
    whatsappConfig = { enabled: false };
    return false;
  }

  if (!phone || !apiKey) {
    console.error(
      "WhatsApp is enabled but missing CallMeBot configuration variables (WHATSAPP_PHONE/WHATSAPP_TO and WHATSAPP_API_KEY/WHATSAPP_CALLMEBOT_API_KEY).",
    );
    whatsappConfig = { enabled: false };
    return false;
  }

  whatsappConfig = {
    enabled: true,
    provider,
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
      if (whatsappConfig.provider === "callmebot") {
        await sendViaCallMeBot(chunk);
      }
    }

    console.log(
      `WhatsApp notification sent successfully via ${whatsappConfig.provider}`,
    );
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
