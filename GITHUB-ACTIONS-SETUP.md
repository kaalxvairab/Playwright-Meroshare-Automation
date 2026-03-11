# GitHub Actions Setup Guide for NICDDF Automation

This guide explains how to set up the GitHub Actions workflow for automated NICDDF testing.

## 📋 Prerequisites

- GitHub repository with admin/settings access
- NICDDF credentials
- WhatsApp API keys (optional, for notifications)
- Slack webhook URL (optional, for Slack notifications)

## 🔧 Configuration Steps

### Step 1: Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add the following secrets:

#### Required Secrets:

```
NICDDF_USERNAME          # Your NICDDF login username
NICDDF_PASSWORD          # Your NICDDF login password
```

#### Optional - WhatsApp Notifications:

```
WHATSAPP_ENABLED         # Set to "true" to enable
WHATSAPP_TO              # Phone number with country code (e.g., 447587821393)
WHATSAPP_CALLMEBOT_URL   # https://api.callmebot.com
WHATSAPP_CALLMEBOT_API_KEY # Your CallMeBot API key
```

#### Optional - Telegram Notifications:

```
TELEGRAM_ENABLED         # Set to "true" to enable
TELEGRAM_BOT_TOKEN       # Your Telegram bot token
TELEGRAM_CHAT_ID         # Your chat ID for notifications
```

#### Optional - Slack Notifications:

```
SLACK_WEBHOOK_URL        # Your Slack webhook URL for failure notifications
```

### Step 2: Verify Secret Setup

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Confirm all secrets are listed (values won't be visible)
3. Each secret should have an "Updated recently" indicator

### Step 3: Enable Workflow

The workflow file is at `.github/workflows/nicddf-automation.yml`

If the workflow isn't showing up:

1. Go to **Actions** tab in your repository
2. Click **New workflow**
3. Or just push code with the workflow file

## 📅 Workflow Triggers

The workflow runs:

1. **Daily Schedule**: Every day at 9:00 AM UTC
   - Can be modified in the `cron` expression
2. **On Push**: When changes are pushed to `main`/`master` branch
   - Only when files in `tests/NICDDF/` are modified
3. **Manual Trigger**:
   - Go to **Actions** → **NICDDF Automation Tests**
   - Click **Run workflow**
   - Optional: Select "Run in headed mode"

## 🕐 Customize Schedule (Cron)

Edit `.github/workflows/nicddf-automation.yml` and modify this line:

```yaml
- cron: "0 9 * * *" # 9:00 AM UTC daily
```

Common cron examples:

- `0 9 * * *` → Every day at 9:00 AM UTC
- `0 9 * * 1-5` → Weekdays at 9:00 AM UTC
- `0 */6 * * *` → Every 6 hours
- `0 9,17 * * *` → 9 AM and 5 PM UTC

## 📊 Monitoring Tests

### View Test Results

1. Go to **Actions** tab
2. Click on the workflow run
3. Review logs and artifacts

### Download Artifacts

- **playwright-report**: Full HTML test report
- **test-results**: Detailed test result logs
- Available for 7 days by default

### View Test Logs

Click any step in the workflow to see detailed console output

## 🔔 Notifications

### WhatsApp

When nav value is found:

- Automatic WhatsApp message sent
- Requires `WHATSAPP_ENABLED=true`

### Slack

On test failure:

- Automatic Slack notification sent to webhook
- Requires `SLACK_WEBHOOK_URL` configured

## 🛠️ Troubleshooting

### Tests Not Running

- ✅ Verify workflow file exists at `.github/workflows/nicddf-automation.yml`
- ✅ Check **Actions** tab shows the workflow
- ✅ Verify secrets are set correctly

### Login Failures

- ✅ Verify `NICDDF_USERNAME` and `NICDDF_PASSWORD` are correct
- ✅ Ensure credentials haven't changed
- ✅ Check for account lockouts

### Notification Issues

- ✅ Verify API keys are correct
- ✅ Check payment/quota on notification services
- ✅ Verify phone numbers include country code

### Timeout Issues

- Default timeout: 15 minutes per test
- Can be modified in workflow file: `timeout-minutes: 15`

## 📝 Best Practices

1. **Never commit secrets to repository**
   - Always use GitHub Secrets
2. **Keep credentials rotated**
   - Update GitHub Secrets regularly
3. **Monitor workflow runs**
   - Review Slack/WhatsApp notifications
   - Check artifacts for test reports
4. **Test locally first**
   - Run `npm run nicddf` locally before pushing
   - Ensure all tests pass before GitHub Actions

## 🔒 Security Notes

- Secrets are encrypted and never logged
- Workflow has `forbidOnly: true` to prevent accidental test.only
- Screenshots and videos are disabled for security
- Retries only on CI environment (3 times)

## 📖 Usage Examples

### Run Schedule Variations

**Run every 30 minutes:**

```yaml
schedule:
  - cron: "*/30 * * * *"
```

**Run only on weekdays at 8 AM:**

```yaml
schedule:
  - cron: "0 8 * * 1-5"
```

**Run on specific dates:**

```yaml
schedule:
  - cron: "0 9 15 * *" # 15th of every month at 9 AM
```

## 📞 Support

For issues with:

- **Workflow setup**: Check GitHub documentation
- **Playwright**: Visit playwright.dev
- **NICDDF**: Contact support
- **CallMeBot**: Check api.callmebot.com status
