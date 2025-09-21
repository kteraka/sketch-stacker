# MCP Server Setup Guide

このドキュメントでは、Claude Code Dev Container環境でのMCPサーバーセットアップ方法を説明します。

## 📋 概要

MCPサーバーを使用することで、Claude CodeにOpenAI o3による高度な検索機能を追加できます。このプロジェクトでは`o3-search-mcp`を導入しています。

## 🔧 セットアップ済みの構成要素

### 1. Dockerfile設定
```dockerfile
# Install o3-search-mcp server
RUN git clone https://github.com/yoshiko-pg/o3-search-mcp.git /tmp/o3-search-mcp && \
    cd /tmp/o3-search-mcp && \
    pnpm install && \
    pnpm build && \
    pnpm pack && \
    npm install -g o3-search-mcp-*.tgz && \
    rm -rf /tmp/o3-search-mcp
```

### 2. devcontainer.json設定
```json
"containerEnv": {
  "OPENAI_API_KEY": "${localEnv:OPENAI_API_KEY}",
  "OPENAI_MODEL": "${localEnv:OPENAI_MODEL:o3-mini}"
}
```

### 3. 環境変数テンプレート
`.env.example`ファイルに必要な環境変数の例を記載。

### 4. セットアップスクリプト
`setup-mcp.sh`による自動化されたMCPサーバー追加。

## 🚀 使用方法

### 前提条件
- OpenAI APIキー（Tier 4または組織認証が必要）
- o3、o3-mini、gpt-5モデルへのアクセス

### ステップ1: 環境変数設定
ホスト環境（Mac/Linux）で以下を実行：

```bash
export OPENAI_API_KEY='your-openai-api-key-here'
export OPENAI_MODEL='o3-mini'  # または 'o3', 'gpt-5'
```

**重要**: `export`を付けないと子プロセス（VS Code）に渡されません。

### ステップ2: VS Code再起動
環境変数を設定したターミナルから：
```bash
code .
```

### ステップ3: Dev Container起動
VS CodeでDev Containerを開く。

### ステップ4: MCPサーバー設定
```bash
./setup-mcp.sh
```

### ステップ5: 動作確認
```bash
claude mcp list
```

VS Codeを再起動（`Cmd+Shift+P` → `Developer: Reload Window`）すると、MCPサーバーが利用可能になります。

## 📁 作成されるファイル

### .mcp.json
```json
{
  "mcpServers": {
    "o3-search": {
      "type": "stdio",
      "command": "npx",
      "args": ["o3-search-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-proj-...",
        "OPENAI_MODEL": "gpt-5"
      }
    }
  }
}
```

このファイルはプロジェクト固有の設定を保存し、gitで管理されます（APIキー含む）。

## 🔍 機能

MCPサーバーが正しく動作すると、以下の機能が利用可能：

- **高度な検索**: OpenAI o3を使った詳細な情報検索
- **コンテンツ分析**: 複雑な質問への包括的な回答
- **ソース付き情報**: 信頼できるソースからの情報提供
- **2024年最新情報**: 最新のベストプラクティスや新機能

## 🛠️ トラブルシューティング

### 環境変数が読み込まれない
**原因**: `export`なしで設定、またはVS Code再起動が必要
**解決策**:
1. `export OPENAI_API_KEY='key'`で再設定
2. 同じターミナルから`code .`で起動
3. Dev Container再構築

### MCPサーバーが認識されない
**原因**: Claude Codeの設定読み込みが未完了
**解決策**:
1. `Developer: Reload Window`実行
2. `.mcp.json`ファイルの存在確認
3. Dev Container完全再起動

### APIキーエラー
**原因**: OpenAI APIキーが無効またはTier不足
**解決策**:
1. OpenAI Platformでキー確認
2. Tier 4または組織認証の確認
3. 使用量制限の確認

### zshエラー (job table full)
**原因**: zsh設定の問題
**解決策**:
```bash
bash
export OPENAI_API_KEY='your-key'
code .
```

## 🔒 セキュリティ考慮事項

### APIキー管理
- APIキーは`.env.local`に保存（gitignore済み）
- ホスト環境変数として管理
- コンテナ内には永続化しない

### ファイル権限
- `.mcp.json`にはAPIキーが含まれる
- 本番環境では適切なアクセス制御を実装

## 📚 参考資料

- [Claude Code MCP Documentation](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [o3-search-mcp Repository](https://github.com/yoshiko-pg/o3-search-mcp)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 🔄 更新履歴

- 2024-09-13: 初版作成、o3-search-mcp導入
- Dev Container環境での動作確認完了