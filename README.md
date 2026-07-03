# Calorie Tracker

使用 Vue 3、Vite、TypeScript 與 Firebase Realtime Database 開發的每日熱量管理系統。

## 專案簡介

Calorie Tracker 用來記錄每日飲食、運動與體重，並自動計算：

- 今日攝取熱量
- 今日消耗熱量
- 今日淨熱量
- 剩餘可攝取熱量
- 體重與 BMI 變化
- 統計圖表趨勢

目前專案以 MVP 為主，已完成登入、Dashboard、飲食 CRUD、運動 CRUD、體重 CRUD、設定頁與統計頁。

目前也已加入 AI 第一階段 MVP：

- AI 文字解析飲食
- AI 今日健康摘要
- Cloudflare Workers AI Gateway
- 多 Provider / 多 API Key fallback 架構

## 技術棧

- Vue 3
- Vite
- TypeScript
- Element Plus
- Pinia
- Vue Router
- Firebase Authentication
- Firebase Realtime Database
- ECharts
- Axios
- Cloudflare Workers

## 目前功能

### 身分驗證

- Email / Password 註冊登入
- Google Login
- 路由登入保護

### Dashboard

- 今日攝取熱量
- 今日消耗熱量
- 今日淨熱量
- 剩餘可攝取熱量
- 今日飲食摘要
- 今日運動摘要
- 今日體重摘要
- AI 健康助手

### 飲食紀錄

- 新增、編輯、刪除
- 依日期篩選
- 自動計算總熱量

### 運動紀錄

- 新增、編輯、刪除
- 自動計算總消耗

### 體重紀錄

- 新增、編輯、刪除
- BMI 計算
- 趨勢資料顯示

### 統計分析

- 攝取熱量趨勢
- 消耗熱量趨勢
- 淨熱量趨勢
- 體重趨勢

### 個人設定

- 身高
- 體重
- 年齡
- 性別
- 活動量
- 每日目標熱量
- 每日運動消耗目標
- 目標體重

### AI 功能

- 自然語言解析飲食內容
- AI 解析後可人工確認與編輯
- 確認後才寫入 Firebase，避免錯誤資料直接入庫
- 依今日飲食、運動、BMR 與淨熱量產生 AI 健康摘要
- 預留餐點照片辨識 API

## 專案結構

```text
src
  api/           Firebase CRUD 封裝
  assets/        圖片資源
  components/    共用元件
  constants/     常數設定
  firebase/      Firebase 初始化與操作
  prompts/       AI prompt 模板
  layouts/       版型
  router/        路由設定
  stores/        Pinia 狀態管理
  styles/        全域樣式
  types/         共用型別
  utils/         共用工具函式
  views/         頁面
```

## 路由

```text
/login
/register
/
/foods
/exercises
/weights
/statistics
/settings
```

## 安裝與啟動

### 1. 安裝套件

```bash
npm install
```

### 2. 建立環境變數

將 `.env.example` 複製成 `.env`：

```bash
cp .env.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

### 3. 設定 Firebase 參數

`.env` 需包含：

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_AI_GATEWAY_BASE_URL=
```

### 4. 啟動開發環境

```bash
npm run dev
```

### 5. 建置正式版本

```bash
npm run build
```

### 6. 本地預覽

```bash
npm run preview
```

## Firebase 設定

### Authentication

請在 Firebase Console 啟用：

- Email / Password
- Google

### Realtime Database 結構

```text
users/{uid}/profile
foods/{uid}/{foodId}
exercises/{uid}/{exerciseId}
weights/{uid}/{weightId}
```

### Realtime Database Rules

專案內建規則檔案：

- [database.rules.json](C:/Users/serva/Desktop/calorie-tracker/database.rules.json)

核心原則是每位使用者只能讀寫自己的資料：

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "foods": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "exercises": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "weights": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

如果 Google Login 出現 `Permission denied`，請優先確認：

- Realtime Database Rules 已經發佈成上述版本
- 使用的是同一個 Firebase 專案
- Authentication 的 Google Provider 已啟用
- `.env` 中的 `VITE_FIREBASE_DATABASE_URL` 指向正確專案

## AI Gateway 設定

AI 後端位於：

- [workers/calorie-ai-gateway](C:/Users/serva/Desktop/calorie-tracker/workers/calorie-ai-gateway/README.md)

功能重點：

- 支援 `groq`
- 支援 `openai`
- 支援 `openai_compat`
- 支援同一 provider 綁定多組 API Key
- 當單一 key 或單一 provider 失敗時，自動切換下一組

### Frontend 環境變數

本機串接 Worker 時，在前端 `.env` 設定：

```env
VITE_AI_GATEWAY_BASE_URL=http://127.0.0.1:8787
```

### Worker 本機開發

```bash
cd workers/calorie-ai-gateway
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

Windows PowerShell：

```powershell
Set-Location workers/calorie-ai-gateway
npm install
Copy-Item .dev.vars.example .dev.vars
npm run dev
```

`.dev.vars` 需要至少填入一種來源，例如：

```env
GROQ_MODEL=openai/gpt-oss-120b
GROQ_API_KEYS_JSON=["gsk-xxx-primary","gsk-xxx-backup"]
OPENAI_API_KEYS_JSON=["sk-xxx-primary","sk-xxx-backup"]
OPENAI_COMPAT_BASE_URL=
OPENAI_COMPAT_MODEL=
OPENAI_COMPAT_API_KEYS_JSON=[]
ALLOWED_ORIGIN=http://localhost:5173
AI_PROVIDER_ORDER=groq,openai,openai_compat
```

目前 Worker API：

- `POST /api/ai/parse-food-text`
- `POST /api/ai/daily-summary`
- `POST /api/ai/meal-photo`

## 開發規範

- 使用 Vue 3 Composition API
- 使用 `<script setup lang="ts">`
- UI 採用 Element Plus
- 狀態統一放在 Pinia
- Firebase 操作集中於 `src/firebase`
- CRUD API 封裝集中於 `src/api`
- 型別集中於 `src/types`
- 工具函式集中於 `src/utils`
- 需兼顧桌機與手機版畫面

## 已知狀態

- 專案可正常 `npm run build`
- AI 第一階段 MVP 已可用於 Dashboard
- 新增/編輯/刪除飲食、運動、體重後，列表會重新抓取資料
- 部分舊頁面仍有中文編碼亂碼，建議後續逐頁整理文案

## 後續可擴充

- 常用食物 / 常用運動
- 每週 / 每月分析
- TDEE 分析
- AI 飲食分析深化
- 食物辨識與熱量推估正式上線
- AI 減脂 / 增肌建議
- AI 每週 / 每月健康報告
- Excel / PDF 匯出
- Dark Mode
