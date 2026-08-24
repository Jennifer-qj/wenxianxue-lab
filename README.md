# 文献学实验室 · Wenxianxue Lab

[![Deploy to GitHub Pages](https://github.com/Jennifer-qj/wenxianxue-lab/actions/workflows/deploy.yml/badge.svg)](https://github.com/Jennifer-qj/wenxianxue-lab/actions/workflows/deploy.yml)
[![Quality checks](https://github.com/Jennifer-qj/wenxianxue-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/Jennifer-qj/wenxianxue-lab/actions/workflows/ci.yml)

一个面向大学生与文献学初学者的互动学习网站，也是一项持续生长的个人数字人文实践。

## 项目目标

1. 将《文献学概要》的全书知识转化为可探索、可练习、可复习的学习系统。
2. 通过知识图谱、互动实验和原创内容，展示对文献学知识的再组织与数字化表达。

## 当前功能

- 七条学习路径、十四章导读与覆盖矩阵
- 143 个结构化学习单元、176 个独立概念词条与 98 条有证据关系
- 134 道九题型练习、十四章深度研读、六项旗舰实验与十五个章节案例
- 支持同义入口、近似纠错、相关度排序和复核状态筛选的全站搜索
- 自动错题本、本地学习进度，以及包含札记与收藏的统一档案导入导出
- 全站随身札记、页面收藏、最近浏览和独立个人学习工作台
- 可拖动知识图谱、关系与置信度筛选、原创方法图示和研读札记导出
- 古籍鉴定综合案卷：五室证据研判、综合意见、学习报告与 Markdown 导出
- 移动端适配、首次访问引导、永久使用指南、项目方法页与覆盖／核验矩阵
- 适配社交平台的分享卡、结构化数据、站点地图与项目展示截图包

## 在线入口

- 网站首页：https://jennifer-qj.github.io/wenxianxue-lab/
- 使用指南：https://jennifer-qj.github.io/wenxianxue-lab/guide/
- 更新日志与开放数据：https://jennifer-qj.github.io/wenxianxue-lab/updates/
- 个人学习工作台：https://jennifer-qj.github.io/wenxianxue-lab/notebook/

## 后续维护

- 继续依据纸本逐条核验页码与学术表述
- 扩充跨章关系、实验反馈层次和高质量案例材料

## 纠错、引用与维护

- 内容或网站问题请使用 [GitHub Issues](https://github.com/Jennifer-qj/wenxianxue-lab/issues/new/choose)。
- 提交修改前请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。
- 项目引用信息见 [CITATION.cff](./CITATION.cff)。
- Pull Request 会自动执行内容门禁、构建、断链检查和测试；依赖更新由 Dependabot 按月检查。

## 版权与内容原则

本项目参考杜泽逊《文献学概要（修订本）》，但不是该书的在线电子版。

- 不在公开仓库保存原书 OCR、扫描件或大段逐字转录。
- 网站内容以原创概括、评论、互动案例和自制图示为主。
- 仅经纸本核验的页码作为公开引用锚点；待核验内容会明确标记状态。
- 当前仓库未授予代码或网站内容的再许可；后续将分别制定许可说明。

原书文字、图片及其他第三方材料的权利归各自权利人所有。

## 本地开发

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm build
```

推送至 `main` 后，GitHub Actions 将自动构建并部署到 GitHub Pages。
