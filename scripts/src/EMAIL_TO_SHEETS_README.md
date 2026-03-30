# email-to-sheets

Reads emails from Gmail and writes them to a Google Sheet.

## What it writes

Each row in the spreadsheet will contain:
| Column | Description |
|--------|-------------|
| Subject | Email subject line |
| Sender | From address |
| Date | Date the email was sent |
| Body Snippet | First ~300 characters of the email body |

## Setup

### 1. Connect Gmail and Google Sheets (one-time)
In Replit, connect your Gmail and Google Sheets accounts via the Integrations panel.

### 2. Set environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SPREADSHEET_ID` | Yes | The ID from your Google Sheet URL: `https://docs.google.com/spreadsheets/d/**ID**/edit` |
| `GMAIL_CONNECTION_ID` | Yes | Your Replit Gmail connector connection ID |
| `SHEETS_CONNECTION_ID` | Yes | Your Replit Google Sheets connector connection ID |
| `SHEET_NAME` | No | Tab name to write to (default: `Emails`) |
| `MAX_EMAILS` | No | Max emails to fetch (default: `50`) |

### 3. Create the Google Sheet
Create a blank Google Sheet and copy the ID from the URL.

## Running

```bash
pnpm --filter @workspace/scripts run email-to-sheets
```

The script will:
1. Fetch your latest inbox emails
2. Clear the target sheet tab
3. Write a header row + one row per email
