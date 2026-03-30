/**
 * Google Sheets client using Google OAuth2 credentials stored as environment variables.
 * Do NOT cache the returned client — tokens can expire.
 *
 * Required environment variables:
 *   GOOGLE_CLIENT_ID      - from Google Cloud Console OAuth 2.0 credentials
 *   GOOGLE_CLIENT_SECRET  - from Google Cloud Console OAuth 2.0 credentials
 *   GOOGLE_REFRESH_TOKEN  - obtained from the one-time auth flow (run: pnpm email-to-sheets-auth)
 */

import { google } from "googleapis";

export function getSheetsClient() {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
  const refreshToken = process.env["GOOGLE_REFRESH_TOKEN"];

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Google OAuth credentials.\n" +
        "Set these environment variables as Replit Secrets:\n" +
        "  GOOGLE_CLIENT_ID\n" +
        "  GOOGLE_CLIENT_SECRET\n" +
        "  GOOGLE_REFRESH_TOKEN\n\n" +
        "To get a refresh token, run:\n" +
        "  pnpm --filter @workspace/scripts run email-to-sheets-auth"
    );
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret, "urn:ietf:wg:oauth:2.0:oob");
  auth.setCredentials({ refresh_token: refreshToken });

  return google.sheets({ version: "v4", auth });
}
