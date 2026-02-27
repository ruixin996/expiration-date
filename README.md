# 有效期（保质期）管理网页

纯前端网页应用，用于管理物品有效期。数据保存在浏览器本地（localStorage），无需后端。

## 功能

- 录入字段：SKU、名称、类别、生产日期、有效期（天/月/年）、提前提醒天数
- 自动计算到期日期与剩余天数，状态分为：正常 / 即将过期 / 已过期
- 搜索（SKU/名称/类别）、筛选、排序
- 导入/导出 JSON 备份
- 手机端可用（建议部署到 HTTPS）

## 使用

### 方式 1：直接打开（电脑）

双击打开 `index.html`（推荐 Chrome / Edge）。

### 方式 2：本地启动（可用于手机同 Wi‑Fi 访问）

在项目目录运行：

```bash
npm install
npm run start
```

然后用浏览器打开终端输出的地址。

### 方式 3：GitHub Pages（推荐，HTTPS，手机更稳定）

把代码推到 GitHub 后，在仓库：

- Settings → Pages → Deploy from a branch
- Branch 选择 `main`，目录 `/(root)`

发布后会得到 `https://<user>.github.io/<repo>/` 地址。

## 扫码说明

网页扫码依赖浏览器与扫码库（QuaggaJS），速度和稳定性受设备、光线、对焦影响较大。
如果你更在意“秒扫”，建议使用微信/支付宝扫码后复制粘贴到 SKU，或使用蓝牙条码枪。

