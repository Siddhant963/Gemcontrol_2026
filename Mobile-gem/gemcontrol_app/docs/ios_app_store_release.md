# iOS App Store Release (via Xcode)

Project-specific notes for RatnSetu (`com.ratnsetu.app`), team `N5K355S6NS`.

## 1. Bump the version

Version/build number is controlled from Flutter, not Xcode — `Info.plist` and
the Xcode project both read `$(FLUTTER_BUILD_NAME)` / `$(FLUTTER_BUILD_NUMBER)`,
which come from `pubspec.yaml`.

Current: `version: 1.0.6+6` in [pubspec.yaml](../pubspec.yaml).

- Bump the number after the `+` (build number) on **every** upload — App Store
  Connect rejects a re-upload with a build number it has already seen, even if
  the marketing version (before the `+`) stays the same.
- Bump the marketing version (e.g. `1.0.6` → `1.0.7`) when it's a release you
  want users to see as a new version.

Edit the `version:` line, e.g.:

```yaml
version: 1.0.7+7
```

## 2. Install dependencies

```bash
cd Mobile-gem/gemcontrol_app
flutter pub get
cd ios
pod install
```

Always open the **`.xcworkspace`**, never the `.xcodeproj` — CocoaPods wires
dependencies through the workspace.

## 3. Open in Xcode

```bash
open ios/Runner.xcworkspace
```

## 4. Check signing before archiving

- Select the **Runner** target → **Signing & Capabilities**.
- Confirm "Automatically manage signing" is checked, Team is
  `N5K355S6NS`, and Bundle Identifier is `com.ratnsetu.app`.
- Make sure you're signed into the right Apple ID in
  Xcode → Settings → Accounts.

## 5. Select the right build destination

At the top of the Xcode window, next to the scheme selector, choose
**Any iOS Device (arm64)** — archiving is not available when a simulator is
selected.

## 6. Archive

- Menu: **Product → Archive**.
- Xcode builds in Release configuration automatically for archives.
- When it finishes, the **Organizer** window opens with your new archive
  selected (if not, **Window → Organizer**).

## 7. Distribute

- In Organizer, select the archive → **Distribute App**.
- Choose **App Store Connect** → **Upload**.
- Keep the default options (automatic signing, include symbols) unless you
  have a specific reason to change them.
- Click through to **Upload**. Xcode validates and uploads the build.

## 8. Wait for processing

- Apple emails you when the build finishes processing (usually 10–30 min).
- It then appears under App Store Connect → your app → **TestFlight** and
  under **App Store → iOS App → (+) Version or Platform** build picker.

## 9. Submit for review

- In App Store Connect, open the app version you're releasing.
- Under **Build**, select the newly processed build.
- Fill in "What's New" release notes if required.
- Save, then **Add for Review / Submit for Review**.

## Gotchas specific to this project

- Don't hand-edit `CURRENT_PROJECT_VERSION` / `MARKETING_VERSION` in
  `project.pbxproj` — they're set to `$(FLUTTER_BUILD_NUMBER)` and get
  overwritten by Flutter tooling from `pubspec.yaml` anyway.
- If `pod install` fails with a CocoaPods/Xcode license error, run
  `sudo xcodebuild -license` and `sudo xcodebuild -runFirstLaunch` first.
- `ios/Podfile`, `Podfile.lock`, and the new launcher icon/asset files are
  currently staged but uncommitted — commit them before archiving so the
  build matches what's in git history.
