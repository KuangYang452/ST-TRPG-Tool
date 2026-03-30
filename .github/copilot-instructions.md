# ST-TRPG-Tool 开发指南

## 项目概述

**ST-TRPG-Tool** 是基于 TypeScript 和 Webpack 构建的 SillyTavern 服务器插件。为 AI 智能体提供 TRPG（桌面角色扮演游戏）工具箱，包括骰子、地图、规则书和角色卡查询等功能。该插件通过 SillyTavern 的 Express 路由器暴露 HTTP 端点。

### 架构

- **插件模式**：实现 SillyTavern 插件接口，包含 `init()`、`exit()` 和 `info` 导出
- **构建目标**：Node.js CommonJS 模块（打包为 `dist/plugin.js`）
- **运行时**：加载到 SillyTavern 服务器中，通过 HTTP POST 端点访问
- **核心文件**：`src/index.ts` 定义插件契约并注册路由

## 开发工作流

### 构建命令

```bash
npm run build:dev    # 开发构建（未压缩，更快）
npm run build        # 生产构建（使用 Terser 压缩）
npm run lint         # 检查 TypeScript + ESLint 规则
npm run lint:fix     # 自动修复代码风格问题
```

构建后，将 `dist/plugin.js` 复制到 SillyTavern 的 `/plugins` 文件夹进行测试。

### TypeScript 配置

- **目标**：ES6、CommonJS 模块格式
- **严格模式**：启用（必需）
- **Source Maps**：启用，便于调试
- **输出目录**：tsc 输出到 `./out`（Webpack 覆盖为 `./dist`）

## 插件开发模式

### 路由注册模式

新路由必须在 `init()` 函数中按以下结构实现：

```typescript
// 带中间件的路由（例如 JSON 解析）
router.post('/endpoint-name', jsonParser, async (req, res) => {
    try {
        const data = req.body;
        // 处理请求
        return res.json({ result: 'data' });
    } catch (error) {
        console.error(chalk.red(MODULE_NAME), '错误消息', error);
        return res.status(500).send('内部服务器错误');
    }
});

// 不带中间件的路由
router.post('/probe', (_req, res) => {
    return res.sendStatus(204);
});
```

### 日志记录约定

始终使用 `chalk` 库配合 `MODULE_NAME` 常量进行彩色控制台输出：

```typescript
console.log(chalk.green(MODULE_NAME), '插件已加载！');
console.error(chalk.red(MODULE_NAME), '错误描述', error);
```

### 插件接口要求

所有插件必须导出默认的 `Plugin` 对象，包含：

```typescript
interface Plugin {
    init: (router: Router) => Promise<void>;      // 服务器启动时调用
    exit: () => Promise<void>;                     // 服务器关闭时调用
    info: PluginInfo;                              // 插件元数据
}

interface PluginInfo {
    id: string;           // 唯一标识符（例如 'st-trpg-tools'）
    name: string;         // 显示名称
    description: string;  // 用户显示的描述
}
```

## 依赖项与约定

- **body-parser**：用于解析 JSON 请求体（在路由中导入使用作为中间件）
- **chalk**：用于彩色控制台输出（使用 `new Chalk()` 实例）
- **express**：SillyTavern 提供的 Router 接口，仅添加路由，不创建新 Router
- **模块系统**：项目使用 CommonJS（`"type": "commonjs"`），不使用 `import()` 动态导入语法

## 代码风格与质量检查

- **解析器**：@typescript-eslint/parser
- **环境**：Node.js（无浏览器、无 DOM）
- **关键规则**：
  - 未使用变量报错（允许函数参数）
  - `no-control-regex` 禁用（正则表达式可能包含控制字符）
  - 循环条件可以是常量（如 `while(true)`）
- **忽略目录**：`node_modules/`、`dist/`、`out/`、`bin/`

## 集成点

- **入口点**：SillyTavern 调用 `init(router)` 并存储路由
- **HTTP 端点**：AI 智能体通过 POST 访问 `http://server/plugin-endpoints`
- **关闭钩子**：服务器终止时调用 `exit()`（如需清理资源）

## 插件安装说明

### SillyTavern 安装步骤

1. **构建插件**：运行 `npm run build` 生成生产版本
2. **复制插件**：将整个项目目录复制到 SillyTavern 的 `/plugins` 文件夹
3. **启用插件**：确保 `config.yaml` 中设置 `enableServerPlugins: true`
4. **重启 SillyTavern**：重启服务器以加载插件

### 插件目录结构

```
plugins/
└── st-trpg-tools/          # 插件目录名（使用 info.id）
    ├── index.js           # 插件入口点
    ├── dist/
    │   └── plugin.js      # 构建输出
    ├── package.json       # 插件元数据
    └── src/               # 源代码（可选）
```

### 故障排除

- **插件未加载**：检查控制台日志，确认 `enableServerPlugins: true`
- **路由未注册**：确认插件目录名与 `info.id` 匹配
- **构建失败**：运行 `npm run build:dev` 查看详细错误信息

## 代码注释与国际化

- **所有代码注释均使用中文编写**
- **国际化文本默认以 zh-cn（简体中文）为准**
- 用户界面消息、日志输出等应使用中文

## SillyTavern 官方标准符合性

该项目严格遵循 [SillyTavern 服务器插件标准](https://docs.sillytavern.app/for-contributors/server-plugins/)：

- **导出契约**：
  - `init(router: Router): Promise<void>` - 接收 Express 路由器，返回 Promise
  - `exit(): Promise<void>` - 关闭钩子，必须返回 Promise
  - `info: PluginInfo` - 包含 `id`、`name`、`description` 的插件元数据

- **路由路径**：注册的路由自动映射到 `/api/plugins/{id}/{route}` 路径
  - 例如：`router.post('/foo')` → `/api/plugins/st-trpg-tools/foo`

- **构建配置**：
  - Webpack 目标为 `'node'`（服务器端）
  - 输出格式为 CommonJS（`libraryTarget: 'commonjs'`）
  - 最终构建为 `dist/plugin.js` 单一文件
