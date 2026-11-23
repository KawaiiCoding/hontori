# Hontori: store checklist

## Ready
- One command builds the release: `node tools/build_release.js` writes `dist/` (two minified bundles, sprite sheets, font, icons, manifest, service worker). Run `node tools/build_sheets.js` first whenever the art changes.
- Works offline once loaded: the service worker stores every file under a versioned cache (`hontori2-<version>`). A new version downloads quietly and takes over on the next launch.
- Nothing is fetched from another site. The font ships in `assets/fonts/`.
- No ads, no tracking, no accounts, no analytics. Saves stay on the device (localStorage).
- The full journey is unlocked once; a grown-up check sits before the code field.
- Icons: 192, 512, maskable 512 and apple-touch 180 (`assets/icons/`). Repaint with `node tools/build_release.js --icons`.

## Owner: before any store
1. Play `dist/` from start to the end of Chapter 2 on a real phone (iPhone and Android).
2. Write a privacy policy page (one paragraph: "Hontori collects no data. Saves stay on your device.") and host it at a public URL. Every store asks for it.
3. Screenshots: phone portrait (iPhone 6.7" 1290x2796 and 6.5" 1242x2688; Android at least 1080x1920), plus a 1024x1024 icon from `icon-512.png` painted larger.
4. Short text, long text, support email, category: Games / Adventure (or Role Playing).

## itch.io (web, fastest)
1. Zip the contents of `dist/` (index.html at the top of the zip, not inside a folder).
2. itch.io > Upload new project > Kind: HTML > upload the zip > tick "This file will be played in the browser".
3. Viewport 390 x 844, tick "Mobile friendly" (portrait) and "Fullscreen button".
4. Pricing: free with the code sold on itch ("pay what you want" or a set price that reveals the code), or a paid page.
5. Set visibility to Public.

## App Store (iOS)
1. Apple Developer Program (99 USD/year). Mac with Xcode.
2. Wrap with Capacitor, in a new folder next to the project:
   `npm init -y && npm i @capacitor/core @capacitor/cli @capacitor/ios`
   `npx cap init Hontori com.<you>.hontori --web-dir ../Hontori/dist`
   `npx cap add ios && npx cap sync ios && npx cap open ios`
   After every rebuild of `dist/`: `npx cap sync ios`.
3. In Xcode: team, bundle id, version, Portrait only, Requires full screen, minimum iOS 15; test on the oldest supported device.
4. Purchase must move to in-app purchase (Guideline 3.1.1: a code bought elsewhere cannot unlock content in the app). In App Store Connect create a Non-Consumable "Full journey". Add a store plugin (for example `cordova-plugin-purchase` or RevenueCat's Capacitor plugin), call it from `game/features/unlock.js`, keep the grown-up check before it, add a "Restore purchases" button, and hide the code field in the iOS build.
5. App Privacy: "Data Not Collected"; tracking: No. No App Tracking Transparency prompt needed.
6. Age rating questionnaire: cartoon/fantasy violence "Infrequent/Mild" (spirit duels, nobody is hurt); everything else None; no unrestricted web access; in-app purchase yes. Expected 4+ (9+ if mild violence is marked frequent). Kids Category is optional and adds rules; leave it off unless wanted.
7. Archive in Xcode > upload > TestFlight > submit with screenshots, privacy URL and review notes (how to reach the purchase).

## Google Play (Android)
1. Play Console account (25 USD once). New personal accounts must run a closed test with 12 testers for 14 days before production.
2. Same Capacitor folder: `npm i @capacitor/android && npx cap add android && npx cap sync android && npx cap open android`. Portrait in `AndroidManifest.xml` (`android:screenOrientation="portrait"`).
3. Build > Generate Signed App Bundle (.aab); let Play App Signing hold the key; keep the upload key safe.
4. Purchase: Google Play Billing is required for digital content. Create a one-time product "full_journey"; use the same store plugin as iOS; hide the code field in the Android build.
5. Data safety form: no data collected, no data shared. Ads: No. Target audience: choose ages carefully (under 13 triggers the Families policy); content rating (IARC) questionnaire: fantasy violence, mild.
6. Upload to internal testing, then closed testing, then production.

## Per release
`node tools/build_sheets.js` (if art changed) > `node tools/build_release.js` > test `dist/` offline > `npx cap sync` > raise the version/build number in Xcode and Android Studio > upload.
