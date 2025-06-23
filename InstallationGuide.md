# Market Intelligence Platform - インストールガイド 🚀

本ガイドでは、Market Intelligence & Consumer Insights Platformをローカル環境で完全にセットアップし、実行するための詳細な手順を説明します。

## 📋 前提条件

本アプリケーションをセットアップする前に、以下のソフトウェアがシステムにインストールされていることを確認してください：

### 必須要件
- **Python 3.8以上**: バックエンド（FastAPI）の実行に必要
  ```bash
  python3 --version  # バージョン確認
  ```
- **Node.js 14以上 & npm**: フロントエンド（React）の実行に必要
  ```bash
  node -v && npm -v  # バージョン確認
  ```
- **Git**: リポジトリクローンに必要
  ```bash
  git --version  # バージョン確認
  ```

### APIキー
- **Google Gemini APIキー**: AI機能（感情分析、要約、キーワード抽出）に必要
  - [Google AI Studio](https://aistudio.google.com/) で無料取得可能
  - 機密情報のため安全に管理が必要

## 🔄 セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/yf591/market_intelligence_platform.git
cd market_intelligence_platform
```

### 2. 環境変数の設定

プロジェクトルートディレクトリに `.env` ファイルを作成：

```bash
# プロジェクトルートで実行
cat > .env << 'EOF'
# Google Gemini API Key
GEMINI_API_KEY="your_actual_gemini_api_key_here"

# ReactアプリケーションのバックエンドAPIベースURL
REACT_APP_API_BASE_URL="http://localhost:8000"
EOF
```

**重要**: `your_actual_gemini_api_key_here` を実際のAPIキーに置き換えてください。

### 3. バックエンドセットアップ

```bash
# バックエンドディレクトリに移動
cd backend

# Python仮想環境の作成
python3 -m venv .venv

# 仮想環境のアクティベート
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows

# 依存関係のインストール
pip install -r requirements.txt
```

### 4. フロントエンドセットアップ

新しいターミナルウィンドウで、

```bash
# プロジェクトルートから
cd frontend

# Node.js依存関係のインストール
npm install
```

## 🚀 アプリケーション実行

### バックエンドサーバー起動

```bash
# backend/ディレクトリで仮想環境をアクティベート後
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

サーバーが正常に起動すると以下が表示されます。
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**API確認**: http://localhost:8000/docs でSwagger UIが表示されます。

### フロントエンド開発サーバー起動

別のターミナルで、

```bash
# frontend/ディレクトリで
npm start
```

ブラウザが自動的に http://localhost:3000 を開きます。

## 🧪 動作確認

正常にセットアップされた場合

1. **製品レビューダッシュボード**
   - レビューデータが表示される
   - 各レビューでAI感情分析が実行される
   - 感情分布グラフが表示される

2. **市場ニュースダッシュボード**
   - ニュースデータが表示される
   - AI要約・キーワード抽出が実行される
   - ビジネスインパクト分析結果が表示される

## 🔧 トラブルシューティング

### よくある問題と解決策

#### 1. Gemini API エラー
```
Error: GEMINI_API_KEY is not defined
```
**解決**: `.env`ファイルの配置と内容を確認してください。

#### 2. Python仮想環境エラー
```
ModuleNotFoundError: No module named 'fastapi'
```
**解決**: 仮想環境のアクティベートと依存関係インストールを確認
```bash
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
```

#### 3. Node.js依存関係エラー
```
npm ERR! Cannot resolve dependency
```
**解決**: node_modulesを削除して再インストール
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### 4. CORS エラー
```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**解決**: バックエンドが正常に起動しているか確認。FastAPIのCORS設定は既に構成済みです。

#### 5. APIクォータ制限
```
Error 429: Quota exceeded
```
**解決**: Gemini APIの使用量を確認し、しばらく待ってから再試行してください。

### デバッグのヒント

#### バックエンドログの確認
```bash
# バックエンドターミナルでリアルタイムログを確認
tail -f uvicorn.log  # ログファイルがある場合
```

#### フロントエンドの開発者ツール
- ブラウザの開発者ツール（F12）でコンソールエラーを確認
- ネットワークタブでAPI通信を確認

#### 環境変数の確認
```bash
# .envファイルが正しく読み込まれているか確認
echo $GEMINI_API_KEY  # macOS/Linux
echo %GEMINI_API_KEY%  # Windows CMD
```

## 📦 本番環境デプロイ

### Vercel (フロントエンド)

1. [Vercel](https://vercel.com/)にGitHubアカウントでログイン
2. プロジェクトをインポート
3. Root Directoryを `frontend` に設定
4. 環境変数 `REACT_APP_API_BASE_URL` にバックエンドURLを設定

### Render (バックエンド)

1. [Render](https://render.com/)にGitHubアカウントでログイン
2. 新しいWebサービスを作成
3. 設定
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. 環境変数 `GEMINI_API_KEY` を設定

## 🔐 セキュリティ考慮事項

### APIキー管理
- **.envファイル**: 絶対にバージョン管理に含めない
- **本番環境**: クラウドプロバイダーの環境変数機能を使用
- **ローテーション**: 定期的なAPIキーの更新

### CORS設定
- 本番環境では特定のドメインのみを許可
- 開発環境でのみlocalhost許可

## 📚 追加リソース

- **FastAPI公式ドキュメント**: https://fastapi.tiangolo.com/
- **React公式ドキュメント**: https://react.dev/
- **Google Gemini AI**: https://ai.google.dev/
- **Tailwind CSS**: https://tailwindcss.com/

## 🆘 サポート

問題が解決しない場合
1. [GitHub Issues](https://github.com/yf591/market_intelligence_platform/issues)で報告
2. 詳細なエラーメッセージとステップを含めてください
3. 環境情報（OS、Pythonバージョン、Node.jsバージョン）を記載

---

💡 **ヒント**: このガイドをブックマークし、チームメンバーと共有してスムーズなセットアップを実現してください！

