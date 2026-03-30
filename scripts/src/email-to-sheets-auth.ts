/**
 * email-to-sheets-auth.ts
 *
 * One-time setup script to get a Google OAuth refresh token.
 * Run this once, copy the refresh token, then store it as the
 * GOOGLE_REFRESH_TOKEN secret in Replit.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run email-to-sheets-auth
 *
 * Required Replit Secrets (set before running):
 *   GOOGLE_CLIENT_ID     - from Google Cloud Console
 *   GOOGLE_CLIENT_SECRET - from Google Cloud Console
 */

import { google } from "googleapis";
import * as readline from "readline";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
];

async function main() {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];

  if (!clientId || !clientSecret) {
    console.error(
      "❌ Missing credentials.\n\n" +
        "Before running this script:\n" +
        "1. Go to https://console.cloud.google.com\n" +
        "2. Create a project and enable Gmail API + Google Sheets API\n" +
        "3. Go to APIs & Services → Credentials → Create OAuth 2.0 Client ID\n" +
        "4. Choose 'Desktop app' as the type\n" +
        "5. Copy the Client ID and Client Secret\n" +
        "6. Add them as Replit Secrets: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET\n" +
        "7. Run this script again"
    );
    process.exit(1);
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret, "urn:ietf:wg:oauth:2.0:oob");

  const authUrl = auth.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.log("\n========================================");
  console.log("STEP 1: Open this URL in your browser:");
  console.log("========================================\n");
  console.log(authUrl);
  console.log("\n========================================");
  console.log("STEP 2: Authorize access, then paste the");
  console.log("        code shown by Google below.");
  console.log("========================================\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise<string>((resolve) => {
    rl.question("Enter the authorization code: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  const { tokens } = await auth.getToken(code);

  if (!tokens.refresh_token) {
    console.error(
      "\n❌ No refresh token received.\n" +
        "This can happen if you previously authorized this app.\n" +
        "Go to https://myaccount.google.com/permissions and revoke access,\n" +
        "then run this script again."
    );
    process.exit(1);
  }

  console.log("\n========================================");
  console.log("✅ Success! Your refresh token is:");
  console.log("========================================\n");
  console.log(tokens.refresh_token);
  console.log("\n========================================");
  console.log("STEP 3: Add this as a Replit Secret:");
  console.log("  Name:  GOOGLE_REFRESH_TOKEN");
  console.log("  Value: (the token above)");
  console.log("========================================\n");
  console.log("After that, run:");
  console.log("  pnpm --filter @workspace/scripts run email-to-sheets\n");
}

main().catch((err) => {
  console.error("❌ Error:", err?.message ?? err);
  process.exit(1);
});
