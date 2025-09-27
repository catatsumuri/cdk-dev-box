#!/bin/bash
set -e

# Update package lists
apt-get update

# Install packages
apt-get install -y curl unzip git jq python3 ripgrep awscli

# Node.js と npm をインストール
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt-get install -y nodejs

# AWS CDK をグローバルにインストール
npm install -g aws-cdk

# OpenAI Codex をインストール
npm install -g @openai/codex

# Claude Code をインストール
npm install -g @anthropic-ai/claude-code

# Git設定を読み込み
CONFIG_FILE="/tmp/config.json"
if [ -f "$CONFIG_FILE" ]; then
  GIT_USERNAME=$(jq -r '.gitUsername' "$CONFIG_FILE")
  GIT_EMAIL=$(jq -r '.gitEmail' "$CONFIG_FILE")

  # Git のグローバル設定
  sudo -u admin git config --global user.name "$GIT_USERNAME"
  sudo -u admin git config --global user.email "$GIT_EMAIL"
fi

# 5GBのスワップファイルを作成
fallocate -l 5G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# スワップファイルを永続化
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# CDKテストプロジェクト作成用のディレクトリを作成
mkdir -p /home/admin/cdk-test
cd /home/admin/cdk-test
cdk init app --language typescript
npm install --save-dev prettier

tee .editorconfig >/dev/null <<'EOF'
root = true
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
EOF

tee .prettierrc >/dev/null <<'JSON'
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
JSON

chown admin /home/admin -R
