# AGENTS.md

本文件提供給後續接手此專案的開發者或 AI Agent，目標是讓修改可以延續既有結構，不要把專案越改越散。

## 專案定位

- 專案名稱：`calorie-tracker`
- 類型：Vue 3 SPA
- 主要用途：記錄飲食、運動、體重，並計算每日熱量相關指標
- 後端：Firebase Authentication + Firebase Realtime Database

## 技術基線

- Vue 3
- Vite
- TypeScript
- Element Plus
- Pinia
- Vue Router
- Firebase Web SDK
- ECharts

## 開發原則

- 優先延續現有目錄與責任分工
- 新功能以小步驟完成，不一次重寫整個頁面
- 所有新邏輯都要補上型別
- UI 盡量延續現有設計語言
- 若只需修小問題，避免大規模重構
- 修改前先確認是否有使用者自己的未提交變更

## 目錄責任

### `src/firebase`

- 放 Firebase 初始化
- 放與 Auth / Database 直接互動的底層邏輯
- 不要把頁面邏輯直接塞進這裡

### `src/api`

- 放各模組 CRUD 封裝
- 頁面與 store 不直接散寫 Database API

### `src/stores`

- 放 Pinia store
- 管理畫面狀態、載入流程、聚合資料

### `src/types`

- 放共用型別
- 新增資料模型時，先補型別再補實作

### `src/utils`

- 放純函式工具
- 適合放日期、熱量、BMI、統計運算

### `src/views`

- 放頁面
- 頁面負責組合 UI 與互動，不要承載太多資料層細節

## 實作規範

- 使用 Vue 3 Composition API
- 使用 `<script setup lang="ts">`
- 預設使用 `ref` / `computed`
- 與 Firebase 互動時要處理 loading、error、empty state
- 表單送出後要同步刷新對應列表或更新 store
- 刪除操作要有確認提示
- 計算型欄位盡量在前端與資料層都保持一致

## Firebase 規則注意事項

- 使用者只能讀寫自己的資料
- 路徑結構以 `uid` 為第一層隔離
- 如果登入成功但寫入失敗，優先檢查：
  - Realtime Database Rules 是否已發佈
  - `databaseURL` 是否正確
  - Google Provider 是否已啟用
  - 寫入路徑是否真的在 `uid` 節點底下

## 常見工作流程

### 新增一個紀錄模組

1. 在 `src/types` 新增型別
2. 在 `src/api` 新增 CRUD 封裝
3. 在 `src/stores` 新增或擴充 store
4. 在 `src/views` 建立頁面
5. 在 `src/router` 註冊路由
6. 在 Dashboard / Statistics 視需要串接摘要或圖表

### 修正 CRUD 問題

1. 先檢查頁面是否有 await store action
2. 再檢查 store 是否有重新抓資料或同步更新本地 state
3. 最後檢查 Firebase 回傳資料格式是否符合型別

### 修正登入問題

1. 檢查 `src/firebase/auth.ts`
2. 檢查 `src/stores/auth.ts`
3. 檢查 Firebase Console 的 Authentication 與 Database Rules

## 文件同步原則

如果有以下變動，請一起更新 [README.md](C:/Users/serva/Desktop/calorie-tracker/README.md)：

- 新增頁面或功能
- 新增必要環境變數
- Firebase 設定方式改變
- 安裝或啟動步驟改變

## 目前已知待整理項目

- 部分頁面仍有中文亂碼，需要逐步清理
- 路由檔與部分舊頁面文案也可能有編碼問題
- 若要進一步上線，建議補上測試與 Firebase Hosting 流程

## 交付標準

- `npm run build` 可通過
- 新增功能至少能完成基本操作流程
- 不破壞登入與既有 CRUD
- 文件同步更新
