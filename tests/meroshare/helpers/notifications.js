/**
 * Unified notifications wrapper - delegates to Telegram and WhatsApp helpers
 */

const {
  initBot,
  sendMessage,
  notifyIPOStatus,
  notifyError,
  notifyIPONotFound,
  notifyIPOOpenForReview,
} = require("./telegram");

const {
  initWhatsApp,
  sendWhatsAppText,
  notifyIPOStatusWhatsApp,
  notifyErrorWhatsApp,
  notifyIPONotFoundWhatsApp,
  notifyIPOOpenForReviewWhatsApp,
} = require("./whatsapp");

/**
 * Send unified notification via WhatsApp and/or Telegram
 * @param {string} message - Message to send
 * @param {Object} options - Configuration options
 * @param {boolean} options.whatsapp - Send via WhatsApp (default: true)
 * @param {boolean} options.telegram - Send via Telegram (default: true)
 */
async function sendNotification(message, options = {}) {
  const { whatsapp = true, telegram = true } = options;

  if (whatsapp) {
    await sendWhatsAppText(message);
  }

  if (telegram) {
    await sendMessage(null, message, { parse_mode: "HTML" });
  }
}

module.exports = {
  sendNotification,
  // Re-export all telegram functions
  initBot,
  sendMessage,
  notifyIPOStatus,
  notifyError,
  notifyIPONotFound,
  notifyIPOOpenForReview,
  // Re-export all whatsapp functions
  initWhatsApp,
  sendWhatsAppText,
  notifyIPOStatusWhatsApp,
  notifyErrorWhatsApp,
  notifyIPONotFoundWhatsApp,
  notifyIPOOpenForReviewWhatsApp,
};
