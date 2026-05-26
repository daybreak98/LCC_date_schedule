# Current Progress

Updated: 2026-05-27

## Completed

- Confirmed the `Build iOS Apps` plugin is installed locally under Codex plugin cache.
- Added Capacitor dependencies and generated the iOS project under `ios/`.
- Added `capacitor.config.json` for the iOS wrapper.
- Added `build:ios`, `ios:sync`, and `ios:open` npm scripts.
- Added `VITE_API_BASE_URL` support so the iOS app can call a backend on the local network.
- Updated the Python backend to support configurable host/port and CORS preflight requests.
- Added `.env.ios.example` and ignored `.env.ios.local`.
- Added iOS installation notes in `docs/ios-install.md`.

## Current Local State

- Local WLAN API target used during setup: `http://192.168.31.180:8000`.
- The generated iOS project is ready to open on a Mac with Xcode at `ios/App/App.xcworkspace`.
- A signed `.ipa` has not been generated in this Windows environment because final iOS signing/install requires macOS and Xcode.
- GitHub pushes were failing earlier because the environment could not connect to `github.com:443`.

## Next Steps

1. On Windows, start the backend with `SCHEDULE_HOST=0.0.0.0`.
2. On a Mac, open `ios/App/App.xcworkspace` with Xcode.
3. Configure Apple signing in Xcode.
4. Connect iPhone and run the app from Xcode.
5. If the computer LAN IP changes, update `.env.ios.local` and run `npm run ios:sync` again.
