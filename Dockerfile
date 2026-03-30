# Use official Playwright image with browsers pre-installed
FROM mcr.microsoft.com/playwright:v1.57.0-jammy

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Playwright browsers are already included in the image
RUN npm install

# Copy application code
COPY . .

# Set environment variables for CI/headless mode
ENV CI=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Expose port (documentation only, doesn't actually open port)
EXPOSE 3000

# Default command
CMD ["npm", "run", "test"]
