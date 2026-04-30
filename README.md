# LoglyLife

LoglyLife is a desktop app built with Tauri, React, TypeScript, Vite, and local SQLite.

## Development

Install dependencies:

```powershell
npm install
```

Run the app in development mode:

```powershell
npm run tauri dev
```

## Build for Distribution

Create Windows installer files:

```powershell
npm run tauri build
```

After a successful build, the distributable files are generated under:

```text
src-tauri/target/release/bundle/
```

For Windows, use one of these files:

```text
src-tauri/target/release/bundle/nsis/LoglyLife_0.1.0_x64-setup.exe
src-tauri/target/release/bundle/msi/LoglyLife_0.1.0_x64_en-US.msi
```

The `.exe` installer is usually the easiest one to share.

## Distribution

Upload the installer to a place where users can download it, such as:

- GitHub Releases
- Google Drive
- Dropbox
- A personal website

Do not distribute old files named `tauri-app_...`; use the `LoglyLife_...` installer files.
