# Market Intelligence & Consumer Insights Platform - インストールガイド

本ドキュメントでは、「Market Intelligence & Consumer Insights Platform」アプリケーションをローカル環境でセットアップし、実行するために必要なすべてのパッケージのインストール手順、コマンド、および`.env`ファイルでのAPIキー管理について詳細に説明します。

## 1. 前提条件

本アプリケーションをセットアップする前に、以下のソフトウェアがシステムにインストールされていることを確認してください。

*   **Python 3.8以上**: バックエンド（FastAPI）の実行に必要です。Pythonのバージョンを確認するには、ターミナルで `python3 --version` または `python --version` を実行します。
*   **Node.js 14以上 & npm (Node Package Manager)**: フロントエンド（React）の実行に必要です。Node.jsのバージョンを確認するには `node -v`、npmのバージョンを確認するには `npm -v` を実行します。ユーザーの環境ではNode.jsとnpmはインストール済みとのことです。
*   **Git**: リポジトリをクローンするために必要です。`git --version` で確認できます。
*   **Google Gemini APIキー**: AI機能（感情分析、要約、キーワード抽出）を利用するために必要です。Google AI Studio ([https://aistudio.google.com/](https://aistudio.google.com/)) で無料で取得できます。APIキーは機密情報であるため、安全に管理する必要があります。

## 2. リポジトリのクローン

まず、本アプリケーションのソースコードをGitHubリポジトリからローカル環境にクローンします。以下のコマンドをターミナルで実行してください。

```bash
git clone https://github.com/yf591/market_intelligence_platform.git
```

クローンが完了したら、プロジェクトのルートディレクトリに移動します。

```bash
cd market_intelligence_platform
```

以降のすべてのコマンドは、この `YOUR_REPOSITORY_NAME` ディレクトリ（`market_intelligence_platform` ディレクトリに相当）をカレントディレクトリとして実行することを前提とします。

## 3. .envファイルの作成とAPIキーの設定

本アプリケーションでは、Google Gemini APIキーなどの機密情報を安全に管理するために、プロジェクトのルートディレクトリに`.env`ファイルを使用します。このファイルはバージョン管理システム（Git）の対象外となるため、誤って公開される心配がありません。

プロジェクトのルートディレクトリ (`market_intelligence_platform/`) に `.env` という名前の新しいファイルを作成し、以下の内容を記述してください。

```dotenv
# Google Gemini API Key
# Google AI Studio (https://aistudio.google.com/) で取得したAPIキーを設定してください。
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# ReactアプリケーションのバックエンドAPIのベースURL
# ローカル開発環境では http://localhost:8000 を使用します。
# デプロイ環境では、デプロイされたバックエンドのURLを設定します。
REACT_APP_API_BASE_URL="http://localhost:8000"
```

**重要**: `YOUR_GEMINI_API_KEY` の部分を、実際にGoogle AI Studioで取得したあなたのGemini APIキーに置き換えてください。引用符（`"`）は含めたままにしてください。

例:
`GEMINI_API_KEY="AIzaSyB-YOUR-ACTUAL-API-KEY-HERE"`

## 4. バックエンドのセットアップとパッケージのインストール

バックエンドはPythonとFastAPIで構築されています。必要なPythonパッケージをインストールし、仮想環境をセットアップします。

### 4.1. 仮想環境の作成とアクティベート

まず、バックエンドディレクトリに移動します。

```bash
cd backend
```

次に、Pythonの仮想環境を作成し、アクティベートします。これにより、プロジェクト固有の依存関係がシステムの他のPythonプロジェクトと衝突するのを防ぎます。

```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linuxの場合
# venv\Scripts\activate   # Windowsの場合（コマンドプロンプト）
# .\venv\Scripts\Activate.ps1 # Windowsの場合（PowerShell）
```

仮想環境がアクティベートされると、ターミナルのプロンプトの先頭に `(venv)` のような表示が追加されます。

### 4.2. Python依存関係のインストール

仮想環境がアクティベートされた状態で、`requirements.txt`に記載されているすべてのPythonパッケージをインストールします。このファイルには、FastAPI、Uvicorn、Google Generative AI SDKなどが含まれています。

**インストールコマンド:**

```bash
pip install -r requirements.txt
```

**インストールされる主なパッケージ:**

*   `fastapi`: 高速なWebフレームワーク
*   `uvicorn`: ASGIサーバー実装
*   `google-generativeai`: Google Gemini APIとの連携用SDK
*   `pydantic`: データ検証と設定管理
*   `python-dotenv`: `.env`ファイルからの環境変数読み込み

これらのパッケージは、バックエンドのAPI機能、AIモデルとの連携、データ処理などを実現するために必要です。

## 5. フロントエンドのセットアップとパッケージのインストール

フロントエンドはReactとTypeScriptで構築されています。必要なNode.jsパッケージ（npmパッケージ）をインストールします。

### 5.1. フロントエンドディレクトリへの移動

プロジェクトのルートディレクトリに戻り、フロントエンドディレクトリに移動します。

```bash
cd .. # backendディレクトリからルートディレクトリに戻る
cd frontend
```

### 5.2. Node.js依存関係のインストール

`package.json`に記載されているすべてのNode.jsパッケージをインストールします。これには、React、TypeScript、Tailwind CSS、Chart.jsなどが含まれています。

**インストールコマンド:**

```bash
npm install
# または、Yarnを使用している場合は yarn install
```

**インストールされる主なパッケージ:**

*   `react`, `react-dom`, `react-scripts`: Reactアプリケーションのコアライブラリとスクリプト
*   `typescript`: JavaScriptに静的型付けを追加
*   `tailwindcss`, `postcss`, `autoprefixer`: Tailwind CSSとその関連ツール
*   `chart.js`, `react-chartjs-2`: データ可視化用のグラフライブラリ

これらのパッケージは、ユーザーインターフェースの構築、スタイリング、データ可視化などを実現するために必要です。

## 6. アプリケーションの実行

すべてのパッケージのインストールが完了したら、バックエンドとフロントエンドをそれぞれ起動してアプリケーションを実行できます。

### 6.1. バックエンドの起動

バックエンドディレクトリ (`market_intelligence_platform/backend/`) にいることを確認し、以下のコマンドを実行します。

```bash
uvicorn main:app --reload
```

このコマンドは、FastAPIアプリケーションを開発モードで起動します。`--reload`オプションにより、コードの変更が自動的に検知され、サーバーが再起動されます。サーバーは通常 `http://127.0.0.1:8000` でリッスンします。

### 6.2. フロントエンドの起動

新しいターミナルウィンドウを開き、フロントエンドディレクトリ (`market_intelligence_platform/frontend/`) に移動して、以下のコマンドを実行します。

```bash
npm start
# または yarn start
```

このコマンドは、React開発サーバーを起動します。通常、ブラウザが自動的に開き、`http://localhost:3000` でアプリケーションが表示されます。

これで、「Market Intelligence & Consumer Insights Platform」がローカル環境で完全に動作するようになります。

---

