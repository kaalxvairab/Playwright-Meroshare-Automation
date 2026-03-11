/**
 * Multi-user configuration for MeroShare IPO automation
 * Supports 10 users with individual credentials
 */

require("dotenv").config();

const users = [
  // User 1 (Primary)
  {
    name: process.env.USER1_NAME || "User 1",
    username: process.env.MEROSHARE_USERNAME,
    password: process.env.MEROSHARE_PASSWORD,
    dp: process.env.MEROSHARE_DP_NP,
    bank: process.env.MEROSHARE_BANK,
    accountNumber: process.env.MEROSHARE_P_ACCOUNT_NO,
    kitta: process.env.MEROSHARE_KITTA_N0,
    crn: process.env.MEROSHARE_CRN_NO,
    txnPin: process.env.MEROSHARE_TXN_PIN,
  },
  // User 2
  {
    name: process.env.USER2_NAME || "User 2",
    username: process.env.USER2_USERNAME,
    password: process.env.USER2_PASSWORD,
    dp: process.env.USER2_DP,
    bank: process.env.USER2_BANK,
    accountNumber: process.env.USER2_ACCOUNT_NO,
    kitta: process.env.USER2_KITTA,
    crn: process.env.USER2_CRN,
    txnPin: process.env.USER2_TXN_PIN,
  },
  // User 3
  {
    name: process.env.USER3_NAME || "User 3",
    username: process.env.USER3_USERNAME,
    password: process.env.USER3_PASSWORD,
    dp: process.env.USER3_DP,
    bank: process.env.USER3_BANK,
    accountNumber: process.env.USER3_ACCOUNT_NO,
    kitta: process.env.USER3_KITTA,
    crn: process.env.USER3_CRN,
    txnPin: process.env.USER3_TXN_PIN,
  },
  // User 4
  {
    name: process.env.USER4_NAME || "User 4",
    username: process.env.USER4_USERNAME,
    password: process.env.USER4_PASSWORD,
    dp: process.env.USER4_DP,
    bank: process.env.USER4_BANK,
    accountNumber: process.env.USER4_ACCOUNT_NO,
    kitta: process.env.USER4_KITTA,
    crn: process.env.USER4_CRN,
    txnPin: process.env.USER4_TXN_PIN,
  },
  // User 5
  {
    name: process.env.USER5_NAME || "User 5",
    username: process.env.USER5_USERNAME,
    password: process.env.USER5_PASSWORD,
    dp: process.env.USER5_DP,
    bank: process.env.USER5_BANK,
    accountNumber: process.env.USER5_ACCOUNT_NO,
    kitta: process.env.USER5_KITTA,
    crn: process.env.USER5_CRN,
    txnPin: process.env.USER5_TXN_PIN,
  },
  // User 6
  {
    name: process.env.USER6_NAME || "User 6",
    username: process.env.USER6_USERNAME,
    password: process.env.USER6_PASSWORD,
    dp: process.env.USER6_DP,
    bank: process.env.USER6_BANK,
    accountNumber: process.env.USER6_ACCOUNT_NO,
    kitta: process.env.USER6_KITTA,
    crn: process.env.USER6_CRN,
    txnPin: process.env.USER6_TXN_PIN,
  },
  // User 7
  {
    name: process.env.USER7_NAME || "User 7",
    username: process.env.USER7_USERNAME,
    password: process.env.USER7_PASSWORD,
    dp: process.env.USER7_DP,
    bank: process.env.USER7_BANK,
    accountNumber: process.env.USER7_ACCOUNT_NO,
    kitta: process.env.USER7_KITTA,
    crn: process.env.USER7_CRN,
    txnPin: process.env.USER7_TXN_PIN,
  },
  // User 8
  {
    name: process.env.USER8_NAME || "User 8",
    username: process.env.USER8_USERNAME,
    password: process.env.USER8_PASSWORD,
    dp: process.env.USER8_DP,
    bank: process.env.USER8_BANK,
    accountNumber: process.env.USER8_ACCOUNT_NO,
    kitta: process.env.USER8_KITTA,
    crn: process.env.USER8_CRN,
    txnPin: process.env.USER8_TXN_PIN,
  },
  // User 9
  {
    name: process.env.USER9_NAME || "User 9",
    username: process.env.USER9_USERNAME,
    password: process.env.USER9_PASSWORD,
    dp: process.env.USER9_DP,
    bank: process.env.USER9_BANK,
    accountNumber: process.env.USER9_ACCOUNT_NO,
    kitta: process.env.USER9_KITTA,
    crn: process.env.USER9_CRN,
    txnPin: process.env.USER9_TXN_PIN,
  },
  // User 10
  {
    name: process.env.USER10_NAME || "User 10",
    username: process.env.USER10_USERNAME,
    password: process.env.USER10_PASSWORD,
    dp: process.env.USER10_DP,
    bank: process.env.USER10_BANK,
    accountNumber: process.env.USER10_ACCOUNT_NO,
    kitta: process.env.USER10_KITTA,
    crn: process.env.USER10_CRN,
    txnPin: process.env.USER10_TXN_PIN,
  },
];

// Filter out users with missing required credentials
const validUsers = users.filter(
  (user) => user.username && user.password && user.dp,
);

module.exports = {
  users: validUsers,
  telegram: {
    enabled: process.env.TELEGRAM_ENABLED,
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  whatsapp: {
    enabled: process.env.WHATSAPP_ENABLED,
    endpoint: process.env.WHATSAPP_CALLMEBOT_URL,
    phone: process.env.WHATSAPP_TO,
    apiKey: process.env.WHATSAPP_CALLMEBOT_API_KEY,
  },
};
