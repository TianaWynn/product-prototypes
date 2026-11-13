# product-prototypes

产品交互原型与产品方案文档，通过 GitHub Pages 发布。

## 目录结构

- `index.html`、`assets/`：交互原型（项目详情 · 重复品检测），即站点首页。
- `docs/`：**产品方案区，与原型分开**。一个方案一个子目录，目录内自带 `index.html` 和 `img/`，不与其他方案共用资源。后续新增方案，在 `docs/` 下再建一个同级子目录即可。

> 命名约定：方案目录内的**文件名一律用 ASCII**（`index.html`、`skill.html`、`img/01-xxx.png`），中文只写在页面标题和正文里 —— GitHub Pages 对非 ASCII 文件名的资源会返回 404。仓库根的 `.nojekyll` 让站点按纯静态文件发布，不做 Jekyll 构建。

| 方案 | 路径 |
| --- | --- |
| 重复品检测产品方案 V1.0 | `docs/duplicate-detection-v1.0/` |

## 在线地址

- 交互原型：https://tianawynn.github.io/product-prototypes/
- 重复品检测产品方案 V1.0：https://tianawynn.github.io/product-prototypes/docs/duplicate-detection-v1.0/
