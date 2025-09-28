
# CDK DevBox

AWS CloudShell内でEC2インスタンスを起動し、CDK開発環境を構築するためのツールです。

## 概要

このツールは以下の機能を提供します：

- 🚀 ワンコマンドでのCDK開発環境構築
- 💰 Spotインスタンス対応によるコスト削減
- 🛠️ 開発に必要なツールの自動インストール
- 🔧 カスタマイズ可能な初期化スクリプト

## セットアップ

### 1. リポジトリのクローン

AWS CloudShell内で以下を実行：

```bash
git clone https://github.com/catatsumuri/cdk-dev-box.git
cd cdk-dev-box
```

### 2. 設定ファイルの編集

`config/config.json`を環境に合わせて設定してください。

**重要な設定項目：**
- `instanceSize`: 最低でもSMALL以上を推奨
- `useSpot`: `true`でSpotインスタンス（コスト削減、可用性注意）
- `gitUsername`, `gitEmail`: Git設定用

## 使用方法

### EC2インスタンスの作成

```bash
# 変更内容を確認
cdk diff

# デプロイ実行
cdk deploy

# 自動承認でデプロイ
cdk deploy --require-approval never
```

### インスタンスへの接続

デプロイ成功後、表示されるIPアドレスに接続：

```bash
ssh admin@<表示されたIP>
```

**OS:** Debian Linux（変更する場合はStackを編集）

## プリインストールパッケージ

| パッケージ | バージョン |
|------------|------------|
| Python 3 | 3.11.2 |
| Node.js | v22.20.0 |
| npm | 10.9.3 |
| AWS CLI | 2.9.19 |
| jq | 1.6 |
| ripgrep | 13.0.0 |
| Claude Code | 1.0.128 |
| codex-cli | 0.42.0 |

**システム設定:**
- 5GBのスワップファイル (`/swapfile`)

## CDK開発環境

### デモプロジェクトの自動作成

`cdk-test`ディレクトリが自動で作成され、以下が設定されます：

- Git設定（`config.json`の値を使用）
- `.editorconfig`
- `.prettierrc`

### 権限管理

#### 読み取り操作（権限昇格不要）

```bash
cdk diff
# または
npx cdk diff
```

#### 書き込み操作（権限昇格が必要）

```bash
# 1. 管理者ロールに一時昇格
ROLE_ARN="arn:aws:iam::<YourAwsAccount>:role/DevBox-AdminRole"

assume_admin() {
  aws sts assume-role \
    --role-arn "$ROLE_ARN" \
    --role-session-name temp-admin \
    --duration-seconds 3600 \
  | jq -r '.Credentials | [
      "export AWS_ACCESS_KEY_ID="+.AccessKeyId,
      "export AWS_SECRET_ACCESS_KEY="+.SecretAccessKey,
      "export AWS_SESSION_TOKEN="+.SessionToken
    ] | .[]'
}

eval "$(assume_admin)"

# 2. 権限確認
aws sts get-caller-identity

# 3. デプロイ実行
cdk deploy
# または
cdk deploy --require-approval never
```

### リソースの削除

```bash
cdk destroy
# または
cdk destroy --force
```

## カスタマイズ

### 初期化スクリプトの変更

`assets/userdata.sh`を編集してパッケージや設定を変更できます。

### インスタンス設定の変更

CDK Stackファイルを編集してインスタンスタイプやOSを変更できます。

## ロードマップ

- [ ] VS Code Dev Containers対応
- [ ] 追加開発ツールの統合
- [ ] 設定テンプレートの拡充
- [ ] CI/CD
