# MobileView — Responsive Viewport & Device Mockup Tester

A modern, high-performance **Manifest V3 Chrome Extension** that allows developers and designers to test mobile responsiveness and UI layouts directly on the active webpage inside realistic smartphone and tablet device mockups.

---

## ✨ Features

- **📱 Realistic Device Mockups**:
  - Precision hardware frames with rounded corners, metallic bezel rim, and physical side buttons.
  - Authentic top elements: **Dynamic Island**, **Traditional Notch**, **Android Punch-Hole**, and **Tablet Bezel**.
  - Integrated status bar with live auto-updating clock, cellular 5G signal, Wi-Fi, and battery indicators.
  - Native gesture home indicator bar at the bottom.

- **🫧 Minimize to Floating Bubble**:
  - Collapse the controls dock into a sleek floating action bubble at the bottom corner.
  - Automatically gives the device mockup maximum screen space to scale up.
  - Simply click the bubble or press <kbd>M</kbd> to expand the full dock back out.

- **🗗 Pop-out to Standalone Window**:
  - Detach the responsive tester from the active tab into a dedicated, standalone floating window.
  - Dock it side-by-side with your code editor (VS Code, WebStorm) or place it on a secondary monitor.
  - Seamlessly keeps the active URL, device preset, and orientation.

- **🌐 Zero Framing Restrictions (Bypass X-Frame-Options & CSP)**:
  - Powered by Chrome's **Declarative Net Request (DNR)** to strip `X-Frame-Options` and `Content-Security-Policy: frame-ancestors` headers on iframe requests.
  - Automatic **Sec-Fetch metadata** and **Mobile User-Agent spoofing**, allowing major platforms like **Facebook**, **Google**, **GitHub**, and **YouTube** to render seamlessly without `refused to connect` or anti-framing errors.

- **🔗 Interactive URL Address Bar**:
  - Live address bar inside the floating control dock to navigate to any custom URL or localhost server.
  - Smart URL auto-normalization (`google.com` → `https://www.google.com/`, `facebook.com` → `https://m.facebook.com/`, `localhost:3000` → `http://localhost:3000/`).
  - One-click quick preset bookmark chips (`Current Tab`, `Google`, `Facebook`, `GitHub`, `Localhost:3000`).

- **🔄 Orientation & Auto-Scale**:
  - **Portrait ↔ Landscape** orientation toggle with smooth rotational geometry transitions.
  - **Dynamic Auto-Fit**: Automatically calculates monitor dimensions to scale down large device frames so they fit comfortably on any screen resolution without clipping.
  - Manual zoom controls (100%, 85%, 75%, 60%, Auto-Fit).

- **⚡ Device Catalog**:
  - **Apple iPhones**: iPhone 16 / 15 / 14 Pro, iPhone 15 / 14 Pro Max, iPhone 14 / 13, iPhone SE (3rd Gen)
  - **Android Flagships**: Samsung Galaxy S24 / S23, Samsung Galaxy S24 Ultra, Google Pixel 8 Pro / 7
  - **Tablets**: iPad Mini (6th Gen), iPad Air / Pro 11"

- **🛡️ 100% Shadow DOM CSS Encapsulation**:
  - Completely isolated from host webpage styles to ensure zero CSS conflicts with Bootstrap, Tailwind, or global resets.
  - Hidden desktop scrollbars with smooth touch and wheel scrolling for an authentic native mobile app feel.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Esc</kbd> | Close mobile overlay |
| <kbd>M</kbd> | Minimize / Expand Controls Dock (Floating Bubble) |
| <kbd>P</kbd> | Pop-out to Standalone Window |
| <kbd>O</kbd> | Toggle Portrait / Landscape orientation |
| <kbd>R</kbd> | Reload current mobile viewport |
| <kbd>↵ Enter</kbd> | Load URL from target input bar |


---

## 🚀 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   ```
2. Open **Google Chrome** and navigate to:
   ```text
   chrome://extensions/
   ```
3. Enable **Developer mode** toggle in the top-right corner.
4. Click the **Load unpacked** button in the top-left.
5. Select the project folder.
6. Click the extension icon in your Chrome toolbar on any website!

---

## 🛠️ Project Structure

```
Responsive/
├── manifest.json       # Manifest V3 configuration & permissions
├── background.js       # Background service worker & dynamic DNR rules
├── content.js          # Shadow DOM builder, device models, navigation & controls
├── styles.css          # Device frame styling, status header & glassmorphic dock
├── rules.json          # Static Declarative Net Request ruleset for header stripping
├── icons/              # Extension icons (16x16, 48x48, 128x128)
└── README.md           # Project documentation
```

---

## 📄 License

MIT License © 2026
