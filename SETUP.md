# Setup guide — connecting to SharePoint via Power Automate

This guide takes about 10 minutes and only needs to be done once.
After setup, anyone with the app link can submit certificates directly into your SharePoint Excel file.

---

## Part 1 — Prepare your SharePoint Excel file

1. Go to your SharePoint site and create a new Excel file called **`Certificate Registry.xlsx`**
2. In the first sheet, add these column headers in row 1 (exact spelling matters):

   | A | B | C | D | E | F | G | H | I | J | K | L | M |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|
   | ID | Type | Name | Organisation | Location | Email | Date | Signer | Delivery | Duration | Format | Notes | CreatedAt |

3. Select the header row and all the data rows below → **Insert → Table** → tick "My table has headers" → OK
4. Name the table **`CertificateRegistry`** (Table Design tab → Table Name field)

---

## Part 2 — Create the Power Automate flow (Write)

This flow receives a submission from the app and adds a row to your Excel table.

1. Go to **[make.powerautomate.com](https://make.powerautomate.com)**
2. Click **+ Create → Instant cloud flow**
3. Name it `Caracol Certificate Registry — Write`
4. Choose trigger: **"When an HTTP request is received"** → Create

### Configure the HTTP trigger

In the trigger step, paste this JSON schema into "Request Body JSON Schema":

```json
{
  "type": "object",
  "properties": {
    "id":        { "type": "string" },
    "type":      { "type": "string" },
    "typeName":  { "type": "string" },
    "name":      { "type": "string" },
    "org":       { "type": "string" },
    "loc":       { "type": "string" },
    "email":     { "type": "string" },
    "date":      { "type": "string" },
    "signer":    { "type": "string" },
    "delivery":  { "type": "string" },
    "duration":  { "type": "string" },
    "format":    { "type": "string" },
    "notes":     { "type": "string" },
    "createdAt": { "type": "string" }
  }
}
```

### Add action: Add a row to Excel

Click **+ New step** → search for **"Add a row into a table"** (Excel Online - Business)

Configure it:
- **Location**: SharePoint
- **Document Library**: your library (e.g. Documents)
- **File**: `Certificate Registry.xlsx`
- **Table**: `CertificateRegistry`
- Map each column to the matching dynamic value from the trigger:
  - ID → `id`, Type → `type`, Name → `name`, Organisation → `org`, etc.

### Add action: Response

Click **+ New step** → search for **"Response"**
- Status Code: `200`
- Body: `{"status":"ok"}`
- Headers: add `Content-Type` = `application/json`

### Save and copy the URL

Click **Save** → go back to the HTTP trigger step → copy the **HTTP POST URL**

---

## Part 3 — Create the Power Automate flow (Read)

This flow lets the Registry tab load all existing entries from Excel.

1. Create another **Instant cloud flow** named `Caracol Certificate Registry — Read`
2. Trigger: **"When an HTTP request is received"** (no body schema needed)

### Add action: List rows from Excel

**"List rows present in a table"** (Excel Online - Business)
- Same file and table as above

### Add action: Response

- Status Code: `200`
- Body (use the expression editor):
```
{
  "entries": @{body('List_rows_present_in_a_table')?['value']}
}
```
- Headers: `Content-Type` = `application/json`

Copy the **HTTP POST URL** for this flow too.

---

## Part 4 — Add the URLs to the app

Open `js/config.js` and paste both URLs:

```js
const CONFIG = {
  POWER_AUTOMATE_WRITE_URL: 'https://prod-xx.westeurope.logic.azure.com/...',
  POWER_AUTOMATE_READ_URL:  'https://prod-xx.westeurope.logic.azure.com/...',
};
```

Then update `js/api.js` — replace `CONFIG.POWER_AUTOMATE_URL` with the two separate constants.

---

## Part 5 — Deploy to GitHub Pages

```bash
git add .
git commit -m "add power automate integration"
git push
```

Go to your repo → **Settings → Pages → Source: main** → Save.

Share the GitHub Pages URL — done. No login, no setup for anyone else.

---

## Troubleshooting

- **CORS error in browser**: In your Power Automate response step, add these headers:
  - `Access-Control-Allow-Origin`: `*`
  - `Access-Control-Allow-Headers`: `Content-Type`
- **Flow not triggering**: Make sure the flow is turned ON (check the flow detail page)
- **Empty registry**: Verify the table name in Excel matches exactly `CertificateRegistry`
