# LoglyLife

LoglyLife は、日々の行動ログやタスクを記録するためのデスクトップアプリです。

Tauri、React、TypeScript、Vite、SQLite を使って作られています。

## 開発用の起動

最初に依存関係をインストールします。

```powershell
npm install
```

開発モードで起動します。

```powershell
npm run tauri dev
```

## 自分のPCで Windows 用にビルドする

Windows 用のインストーラを作るには、次を実行します。

```powershell
npm run tauri build
```

成功すると、配布用ファイルは次の場所に作られます。

```text
src-tauri/target/release/bundle/
```

Windows で配る場合は、主に次のどちらかを使います。

```text
src-tauri/target/release/bundle/nsis/LoglyLife_0.1.1_x64-setup.exe
src-tauri/target/release/bundle/msi/LoglyLife_0.1.1_x64_en-US.msi
```

普通に人に渡すなら、`.exe` の方が分かりやすいです。

## Windows / macOS / Linux 用にまとめてビルドする

このリポジトリには、GitHub Actions の設定があります。

```text
.github/workflows/release.yml
```

この設定により、GitHub 上で次の3種類の配布ファイルを自動生成できます。

- Windows 用
- macOS 用
- Linux 用

リリース用のタグを push すると、自動でビルドが始まります。

```powershell
git tag v0.1.1
git push origin v0.1.1
```

ビルドが成功すると、GitHub に `LoglyLife v0.1.1` という Draft Release が作られ、そこに各OS用のファイルが添付されます。

## GitHub で最後にやること

今の設定では、GitHub Actions が作るリリースは最初 `Draft`、つまり下書き状態です。

下書き状態のままだと、自分には見えますが、他の人がダウンロードできないことがあります。

公開するには、GitHub の画面で次の操作をします。

1. ブラウザで次を開きます。

```text
https://github.com/ichito-watanabe/LoglyLife
```

2. 画面右側、またはページ内の `Releases` をクリックします。

見つからない場合は、次を直接開きます。

```text
https://github.com/ichito-watanabe/LoglyLife/releases
```

3. `LoglyLife v0.1.1` というリリースを探します。

4. `Draft` や `Edit` と表示されている場合は、`Edit` をクリックします。

5. 添付ファイルに各OS用のファイルがあることを確認します。

例:

```text
LoglyLife_0.1.1_x64-setup.exe
LoglyLife_0.1.1_x64_en-US.msi
```

macOS や Linux 用のファイルも同じリリースに添付されます。

6. 問題なければ、ページ下部の `Publish release` をクリックします。

これでリリースが公開され、GitHub に来た人がアプリをダウンロードできるようになります。

## GitHub Actions を手動で再実行する

タグを push し直さずにビルドをやり直したい場合は、GitHub の画面から手動実行できます。

1. 次を開きます。

```text
https://github.com/ichito-watanabe/LoglyLife/actions
```

2. 左側の `Build desktop installers` をクリックします。

3. 右側の `Run workflow` をクリックします。

4. tag に次を入力します。

```text
v0.1.1
```

5. 緑色の `Run workflow` ボタンを押します。

ビルドが終わったら、`Releases` ページで Draft Release を確認し、最後に `Publish release` を押します。

## 配布するときの注意

古い `tauri-app_...` という名前のファイルは配布しないでください。

配布するのは `LoglyLife_...` という名前のファイルです。
