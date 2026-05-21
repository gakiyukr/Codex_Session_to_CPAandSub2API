# ChatGPT Session to CPA / sub2api
# CPA to sub2api / sub2api to CPA

[![Netlify Status](https://api.netlify.com/api/v1/badges/736e9067-6dfc-4c6b-b877-8282bc483cf9/deploy-status)](https://app.netlify.com/projects/chic-marigold-1f6db0/deploys)

純前端單頁工具，用來在瀏覽器本地把 ChatGPT / Codex session JSON、CPA JSON、sub2api JSON 互相轉換。

## 線上使用

### [點我直接使用](https://codex-session-to-cpaandsub2api.netlify.app/)

## 直接下載單文件使用

如果你想離線使用，或直接保存單文件版本，可以下載：

### [下載 index.html](https://github.com/gakiyukr/Codex_Session_to_CPAandSub2API/raw/refs/heads/main/index.html)

下載後直接用瀏覽器打開 `index.html` 即可使用。

## 功能

目前支援 4 種模式：

- `sub2api`
  將 `codex/session JSON` 轉成 `sub2api JSON`
- `CPA`
  將 `codex/session JSON` 轉成 `CPA JSON`
- `CPA -> sub2api`
  將 `CPA JSON` 轉成 `sub2api JSON`
- `sub2api -> CPA`
  將 `sub2api JSON` 轉成 `CPA JSON`

## 使用方式

1. 選擇你要的模式
2. 貼上 JSON，或匯入 `.json` 檔案
3. 點擊 `生成`
4. 複製輸出或下載 JSON

## 當前行為

- 所有轉換都在瀏覽器本地完成，不會上傳資料
- 貼上內容、按 Enter、切換模式、載入示例、上傳檔案，都**不會自動生成**
- 只有點擊 `生成` 才會真正轉換
- 點擊 `生成` 前，會先依照當前模式檢查輸入格式是否合理

## 各模式輸入要求

### `sub2api`

需要輸入 `codex/session JSON`，也就是 ChatGPT / Codex 風格的原始 session 結構，例如常見欄位：

- `user.email`
- `accessToken`
- `sessionToken`
- `expires`
- `account.id`
- `account.planType`

### `CPA`

同樣需要輸入 `codex/session JSON`。

### `CPA -> sub2api`

需要輸入 `CPA JSON`，例如常見欄位：

- `type`
- `account_id`
- `chatgpt_account_id`
- `email`
- `plan_type`
- `access_token`
- `expired`

### `sub2api -> CPA`

需要輸入 `sub2api JSON`，可接受以下三種形狀：

- 完整文件：`{ exported_at, proxies, accounts }`
- `accounts` 陣列
- 單個 `account` 物件

## 輸出說明

### `sub2api`

輸出為 `exported_at / proxies / accounts` 結構，帳號平台為 `openai`，類型為 `oauth`。

### `CPA`

輸出為 `type: "codex"` 的扁平 JSON，包含例如：

- `account_id`
- `chatgpt_account_id`
- `email`
- `plan_type`
- `id_token`
- `access_token`
- `refresh_token`
- `session_token`
- `last_refresh`
- `expired`

若原始輸入沒有可直接使用的 `id_token`，工具會生成可解析的占位 JWT。

## 示例結構

點擊 `填入示例結構` 時，會依目前模式載入不同的匿名化示例：

- `sub2api` / `CPA`
  載入 `codex/session` 風格示例
- `CPA -> sub2api`
  載入 `CPA JSON` 風格示例
- `sub2api -> CPA`
  載入 `sub2api JSON` 風格示例

## 本地使用

直接開啟根目錄的：

```text
index.html
```

目前版本已經合併成單文件可運行，不依賴外部 `app.js` / `styles.css`。

## 安全提醒

- `accessToken`
- `sessionToken`
- `id_token`
- `refresh_token`

以上都屬於敏感資料。請不要把真實憑證分享給他人，也不要把含有真實憑證的 JSON 上傳到不可信的服務。
