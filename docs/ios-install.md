# iOS Packaging And Installation

This project is packaged for iOS with Capacitor. The iOS app loads the built React UI locally and calls the Python API over your local network.

## 1. Prepare the API server on Windows

Find your Windows LAN IP address:

```powershell
ipconfig
```

Start the backend so your iPhone can reach it from the same Wi-Fi:

```powershell
$env:SCHEDULE_HOST="0.0.0.0"
python app.py
```

If Windows Firewall asks, allow Python on the private network.

## 2. Configure the iOS API endpoint

Create a local iOS env file:

```powershell
Copy-Item .env.ios.example .env.ios.local
```

Edit `.env.ios.local` and replace `YOUR_COMPUTER_LAN_IP` with your Windows LAN IP, for example:

```env
VITE_API_BASE_URL=http://192.168.1.23:8000
```

## 3. Build and sync the iOS project

```powershell
npm install
npm run ios:sync
```

The generated Xcode project is in `ios/App/App.xcworkspace`.

## 4. Install on iPhone

You need a Mac with Xcode for the final install step.

1. Move this project folder to the Mac.
2. Open `ios/App/App.xcworkspace` in Xcode.
3. Sign in with your Apple ID in Xcode settings.
4. Select the `App` target, open `Signing & Capabilities`, choose your team, and let Xcode manage signing.
5. Connect your iPhone with USB and trust the computer on the phone.
6. Select your iPhone as the run destination.
7. Press `Run` in Xcode.
8. On iPhone, if prompted, trust the developer profile in `Settings > General > VPN & Device Management`.

## Notes

- The phone and Windows backend must be on the same Wi-Fi when using the local Python API.
- If your LAN IP changes, update `.env.ios.local` and run `npm run ios:sync` again before installing.
- A fully offline native iOS version would require replacing the Python backend with local iOS storage such as SQLite/Core Data.
