/**
 * email-to-sheets.ts
 *
 * Reads emails from Gmail and writes Subject, Sender, Date, and Body snippet
 * to a Google Sheet.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run email-to-sheets
 *
 * Environment variables set automatically by Replit connectors:
 *   REPLIT_CONNECTORS_HOSTNAME, REPL_IDENTITY, WEB_REPL_RENEWAL
 *
 * Required env vars you set (see README below):
 *   GMAIL_CONNECTION_ID      - from Replit Gmail connector
 *   SHEETS_CONNECTION_ID     - from Replit Google Sheets connector
 *   SPREADSHEET_ID           - ID from your Google Sheet URL
 *   SHEET_NAME               - (optional) tab name, defaults to "Emails"
 *   MAX_EMAILS               - (optional) max emails to fetch, defaults to 50
 */

import { getGmailClient } from "./gmail-client.js";
import { getSheetsClient } from "./sheets-client.js";

const SPREADSHEET_ID = process.env["SPREADSHEET_ID"];
const SHEET_NAME = process.env["SHEET_NAME"] ?? "Emails";
const MAX_EMAILS = parseInt(process.env["MAX_EMAILS"] ?? "50", 10);

if (!SPREADSHEET_ID) {
  console.error(
    "❌ SPREADSHEET_ID environment variable is required.\n" +
      "   Set it to the ID from your Google Sheet URL:\n" +
      "   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit"
  );
  process.exit(1);
}

function decodeBase64(encoded: string): string {
  const buf = Buffer.from(encoded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  return buf.toString("utf-8");
}

function getHeader(headers: Array<{ name?: string; value?: string }>, name: string): string {
  return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function extractBodySnippet(payload: any, maxLength = 300): string {
  if (!payload) return "";

  if (payload.body?.data) {
    const decoded = decodeBase64(payload.body.data);
    return decoded.replace(/\s+/g, " ").trim().slice(0, maxLength);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        const decoded = decodeBase64(part.body.data);
        return decoded.replace(/\s+/g, " ").trim().slice(0, maxLength);
      }
    }
    for (const part of payload.parts) {
      const nested = extractBodySnippet(part, maxLength);
      if (nested) return nested;
    }
  }

  return "";
}

async function main() {
  console.log("🔌 Connecting to Gmail...");
  const gmail = await getGmailClient();

  console.log(`📬 Fetching up to ${MAX_EMAILS} emails...`);

  const listRes = await gmail.users.messages.list({
    userId: "me",
    maxResults: MAX_EMAILS,
    labelIds: ["INBOX"],
  });

  const messages = listRes.data.messages ?? [];
  if (messages.length === 0) {
    console.log("📭 No emails found in inbox.");
    return;
  }

  console.log(`📧 Found ${messages.length} emails. Fetching details...`);

  const rows: string[][] = [];

  for (const msg of messages) {
    if (!msg.id) continue;

    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "full",
    });

    const headers = detail.data.payload?.headers ?? [];
    const subject = getHeader(headers, "Subject") || "(no subject)";
    const sender = getHeader(headers, "From") || "(unknown sender)";
    const date = getHeader(headers, "Date") || "(unknown date)";
    const snippet = extractBodySnippet(detail.data.payload) || detail.data.snippet || "";

    rows.push([subject, sender, date, snippet]);
    process.stdout.write(".");
  }
  console.log("\n✅ Email data collected.");

  console.log("📊 Connecting to Google Sheets...");
  const sheets = await getSheetsClient();

  const headerRow = [["Subject", "Sender", "Date", "Body Snippet"]];
  const allRows = [...headerRow, ...rows];

  const range = `${SHEET_NAME}!A1`;

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:D`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values: allRows,
    },
  });

  console.log(`\n🎉 Done! Wrote ${rows.length} emails to "${SHEET_NAME}" tab in your spreadsheet.`);
  console.log(`   View it at: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`);
}

main().catch((err) => {
  console.error("❌ Error:", err?.message ?? err);
  process.exit(1);
});
