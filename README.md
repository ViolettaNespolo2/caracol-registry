# Caracol Certificate Registry

Branded web app for issuing and tracking training certificates, backed by a SharePoint Excel file via Power Automate.

## Quick start

1. Follow **SETUP.md** to create two Power Automate flows and prepare your SharePoint Excel file (~10 min)
2. Paste the flow URLs into `js/config.js`
3. Push to GitHub → enable GitHub Pages → share the link

## Structure

```
caracol-registry/
├── index.html       ← app shell
├── css/style.css    ← Caracol brand styles
├── js/
│   ├── config.js    ← paste your Power Automate URLs here
│   ├── api.js       ← flow calls
│   └── app.js       ← UI logic
├── SETUP.md         ← step-by-step Power Automate setup
└── README.md
```

## Certificate types

- LFAM Professional
- Caracol Academy — Heron AM
- Startup Training — Operations — Heron AM
- Startup Training — Operations — Vipra AM
