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

## Local Windows Build

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
src-tauri/target/release/bundle/nsis/LoglyLife_0.1.1_x64-setup.exe
src-tauri/target/release/bundle/msi/LoglyLife_0.1.1_x64_en-US.msi
```

The `.exe` installer is usually the easiest one to share.

## Cross-Platform Release Build

This repository includes a GitHub Actions workflow at:

```text
.github/workflows/release.yml
```

It builds installers for:

- Windows
- macOS
- Linux

To create a release from GitHub, push a version tag:

```powershell
git tag v0.1.1
git push origin v0.1.1
```

The workflow creates a draft GitHub Release named `LoglyLife v0.1.1` and uploads the generated installers there.

You can also run it manually from GitHub:

```text
Actions > Build desktop installers > Run workflow
```

Enter the release tag, for example:

```text
v0.1.1
```

After the workflow finishes, open the draft release, confirm the attached files, and publish it.

## Distribution

Upload the installer files to a place where users can download them, such as:

- GitHub Releases
- Google Drive
- Dropbox
- A personal website

Do not distribute old files named `tauri-app_...`; use the `LoglyLife_...` installer files.
