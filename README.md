# Christmas Lottery

這個 repo 目前同時包含兩個版本：

- `ChristmasGiftExchange/` 原本的 ASP.NET Core 8 MVC 專案
- `docs/` GitHub Pages 靜態版

## GitHub Pages 版本

GitHub Pages 版放在 `docs/`，使用瀏覽器 `localStorage` 儲存資料，不需要後端。

功能包含：

- 建立活動
- 新增與刪除參與者
- 公平抽籤
- 重抽
- 使用名字與通關碼揭曉個人結果

## 啟用方式

在 GitHub Repository 設定中：

1. 打開 `Settings`
2. 進入 `Pages`
3. Source 選 `Deploy from a branch`
4. Branch 選 `main`
5. Folder 選 `/docs`

之後 GitHub Pages 會從 `docs/` 發佈網站。

## 注意

- 資料只存在目前瀏覽器的 `localStorage`
- 換裝置、換瀏覽器或清除網站資料後，活動與抽籤結果會消失
- 這是免費部署展示版，不是正式後端版
