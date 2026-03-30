/**
 * Gmail client using Replit connector OAuth token.
 * Do NOT cache the returned client — tokens expire.
 */

import { google } from "googleapis";

export async function getGmailClient() {
  const connectionId = process.env["GMAIL_CONNECTION_ID"];
  if (!connectionId) {
    throw new Error(
      "GMAIL_CONNECTION_ID environment variable is not set.\n" +
        "Set it to your Replit Gmail connector connection ID."
    );
  }

  const hostname = process.env["REPLIT_CONNECTORS_HOSTNAME"];
  const replIdentity = process.env["REPL_IDENTITY"];
  const webRenewal = process.env["WEB_REPL_RENEWAL"];

  if (!hostname || !replIdentity) {
    throw new Error(
      "Replit connector environment variables are missing.\n" +
        "Make sure REPLIT_CONNECTORS_HOSTNAME and REPL_IDENTITY are set."
    );
  }

  const tokenUrl = `https://${hostname}/v1/connections/${connectionId}/token`;
  const headers: Record<string, string> = {
    "X-Replit-Identity": replIdentity,
  };
  if (webRenewal) {
    headers["X-Replit-Web-Renewal"] = webRenewal;
  }

  const res = await fetch(tokenUrl, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to get Gmail token: ${res.status} ${body}`);
  }

  const { access_token } = (await res.json()) as { access_token: string };

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token });

  return google.gmail({ version: "v1", auth });
}
