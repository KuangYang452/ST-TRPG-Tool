# ST-TRPG-Tool UI 扩展开发指南

## 项目概述

**ST-TRPG-Tool** 是基于 JavaScript 和 CSS 构建的 SillyTavern UI 扩展。为用户界面提供 TRPG（桌面角色扮演游戏）工具箱，包括骰子、地图、规则书查询等功能。该扩展通过 SillyTavern 的扩展系统集成到设置面板中。

### 架构

- **扩展类型**：UI 扩展（Third-party Extension）
- **安装位置**：`public/scripts/extensions/third-party/st-trpg-tool/`
- **运行环境**：浏览器端，运行在 SillyTavern 的界面中
- **核心文件**：`index.js` 定义扩展逻辑，`manifest.json` 定义扩展信息

## 文件结构

```
st-trpg-tool/
├── manifest.json         # 扩展配置和元数据
├── index.js             # 主扩展逻辑入口
├── style.css            # 扩展样式
├── settings.html        # 设置界面模板（可选）
├── README.md            # 说明文档
└── .github/
    └── copilot-instructions.md
```

## manifest.json 配置

`manifest.json` 是扩展的元数据文件，定义扩展如何被 SillyTavern 加载：

```json
{
    "display_name": "ST-TRPG-Tool",
    "loading_order": 9,
    "js": "index.js",
    "css": "style.css",
    "author": "KuangYang452",
    "version": "1.0.0",
    "homePage": "https://github.com/KuangYang452/ST-TRPG-Tool",
    "minimum_client_version": "1.10.0",
    "hooks": {
        "install": "onInstall",
        "activate": "onActivate"
    }
}
```

### manifest.json 字段说明

- **display_name** ✅ 必需 - 在扩展管理器中显示的名称
- **js** ✅ 必需 - 主 JavaScript 文件路径
- **css** - 可选 - 样式文件路径
- **author** ✅ 必需 - 开发者名称或联系方式
- **version** - 可选 - 版本号
- **loading_order** - 可选 - 加载顺序（值越高加载越晚）
- **minimum_client_version** - 可选 - 最低 SillyTavern 版本要求
- **homePage** - 可选 - 扩展主页 URL
- **hooks** - 可选 - 生命周期钩子映射

## 扩展初始化模式

扩展使用 `SillyTavern.getContext()` API 来访问应用状态和功能：

```javascript
// index.js 中的初始化
const MODULE_NAME = 'st-trpg-tool';

// 获取 SillyTavern 上下文
const {
    extensionSettings,
    saveSettingsDebounced,
    eventSource,
    event_types,
} = SillyTavern.getContext();

// 定义默认设置
const defaultSettings = Object.freeze({
    diceEnabled: true,
    autoRoll: false
});

// 获取或初始化设置
function getSettings() {
    if (!extensionSettings[MODULE_NAME]) {
        extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
    }
    return extensionSettings[MODULE_NAME];
}

// 应用启动时的激活钩子
export async function onActivate() {
    console.log('🎲 ST-TRPG-Tool 扩展已激活');
    await initializeExtension();
}

// 扩展安装时的钩子
export async function onInstall() {
    console.log('🎲 ST-TRPG-Tool 扩展已安装');
}

// 初始化扩展
async function initializeExtension() {
    // 加载设置
    loadSettings();

    // 绑定事件
    bindEventListeners();

    console.log('🎲 ST-TRPG-Tool 初始化完成');
}

// 加载设置
function loadSettings() {
    const settings = getSettings();
    $('#trpg_dice_enabled').prop('checked', settings.diceEnabled).trigger('input');
}

// 绑定事件监听
function bindEventListeners() {
    $('#trpg_roll_dice').on('click', onDiceRollClick);
    $('#trpg_dice_enabled').on('input', onSettingChange);
}

// 处理骰子投掷
function onDiceRollClick() {
    const diceType = $('#trpg_dice_type').val();
    const [count, sides] = diceType.split('d').map(Number);
    const results = rollDice(count, sides);
    
    $('#trpg_dice_result').text(`${count}d${sides}: [${results.join(', ')}]`);
    toastr.success(`骰子结果: ${results.reduce((a, b) => a + b)}`);
}

// 处理设置变更
function onSettingChange(event) {
    const setting = event.target.id.replace('trpg_', '');
    const value = $(event.target).prop('checked');

    const settings = getSettings();
    settings[setting] = value;
    saveSettingsDebounced();
}

// 投骰子逻辑
function rollDice(count, sides) {
    const results = [];
    for (let i = 0; i < count; i++) {
        results.push(Math.floor(Math.random() * sides) + 1);
    }
    return results;
}
```

## 使用 getContext() API

`getContext()` 提供访问 SillyTavern 应用状态的稳定接口：

```javascript
const {
    chat,                          // 聊天记录
    characters,                    // 角色列表
    characterId,                   // 当前角色索引
    extensionSettings,             // 扩展设置对象
    saveSettingsDebounced,         // 防抖保存设置函数
    eventSource, event_types,      // 事件系统
    renderExtensionTemplateAsync,  // 渲染 HTML 模板
    generateQuietPrompt,           // 在聊天上下文中生成文本
    generateRaw,                   // 原始文本生成
    loader,                        // 加载动画
    Popup,                         // 弹窗工具
    macros,                        // 宏系统
    addLocaleData,                 // 国际化
} = SillyTavern.getContext();
```

## HTML 模板使用

使用 Handlebars 模板构建扩展 UI（settings.html）：

```html
<div class="trpg-tool-settings">
    <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b data-i18n="TRPG工具箱">TRPG工具箱</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <div class="trpg-tool-block">
                <label for="trpg_dice_enabled" data-i18n="启用骰子功能">
                    启用骰子功能
                </label>
                <input id="trpg_dice_enabled" type="checkbox" />
            </div>

            <div class="trpg-dice-section">
                <select id="trpg_dice_type">
                    <option value="1d6">1d6</option>
                    <option value="1d20">1d20</option>
                    <option value="2d6">2d6</option>
                </select>
                <button id="trpg_roll_dice" class="menu_button" data-i18n="投骰子">
                    投骰子
                </button>
                <div id="trpg_dice_result" style="margin-top: 5px;"></div>
            </div>

            <hr class="sysHR" />
        </div>
    </div>
</div>
```

在 index.js 中渲染模板：

```javascript
const { renderExtensionTemplateAsync } = SillyTavern.getContext();

async function loadUI() {
    const settingsHtml = await renderExtensionTemplateAsync(
        'third-party/st-trpg-tool',
        'settings'
    );
    $('#extensions_settings').append(settingsHtml);
}
```

## 事件系统

监听 SillyTavern 事件：

```javascript
const { eventSource, event_types } = SillyTavern.getContext();

// 监听聊天变更
eventSource.on(event_types.CHAT_CHANGED, () => {
    console.log('聊天已切换');
});

// 监听消息接收
eventSource.on(event_types.MESSAGE_RECEIVED, (message) => {
    console.log('收到消息');
});

// 监听应用准备就绪
eventSource.on(event_types.APP_READY, () => {
    console.log('应用准备就绪');
});
```

常用事件：`APP_READY`、`CHAT_CHANGED`、`MESSAGE_RECEIVED`、`CHARACTER_EDITED`

## 持久化设置

```javascript
const { extensionSettings, saveSettingsDebounced } = SillyTavern.getContext();

const MODULE_NAME = 'st-trpg-tool';

// 获取设置
function getSettings() {
    if (!extensionSettings[MODULE_NAME]) {
        extensionSettings[MODULE_NAME] = {};
    }
    return extensionSettings[MODULE_NAME];
}

// 修改并保存
const settings = getSettings();
settings.option = value;
saveSettingsDebounced();
```

## 用户反馈

### 提示信息

```javascript
toastr.success('操作成功');
toastr.error('发生错误');
toastr.warning('警告');
toastr.info('提示');
```

### 弹窗

```javascript
const { Popup } = SillyTavern.getContext();

// 确认
const ok = await Popup.show.confirm('确认', '确定吗？');

// 输入
const input = await Popup.show.input('输入', '请输入值', 'default');
```

### 加载动画

```javascript
const { loader } = SillyTavern.getContext();

const handle = loader.show({ message: '处理中...' });
try {
    await operation();
} finally {
    await handle.hide();
}
```

## 样式规范

遵循 SillyTavern 的样式约定：

```css
/* 扩展设置容器 */
.trpg-tool-settings {
    margin: 10px 0;
}

/* 块级元素 */
.trpg-tool-block {
    margin: 8px 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.trpg-tool-block label {
    flex: 1;
}

/* 骰子投掷区域 */
.trpg-dice-section {
    padding: 10px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 5px;
}

/* 按钮样式 */
#trpg_roll_dice {
    background: #007bff;
    color: white;
    padding: 6px 12px;
    border-radius: 3px;
    cursor: pointer;
}

#trpg_roll_dice:hover {
    background: #0056b3;
}

/* 结果显示 */
#trpg_dice_result {
    color: #28a745;
    font-family: monospace;
    margin-top: 5px;
}
```

## 国际化 (i18n)

在 manifest.json 中定义翻译文件：

```json
{
    "i18n": {
        "zh-cn": "i18n/zh-cn.json",
        "en-us": "i18n/en-us.json"
    }
}
```

翻译文件格式 (i18n/zh-cn.json)：

```json
{
    "TRPG工具箱": "TRPG工具箱",
    "启用骰子功能": "启用骰子功能",
    "投骰子": "投骰子",
    "骰子结果": "骰子结果"
}
```

## 最佳实践

### 代码组织

✅ 使用唯一的模块名称避免冲突  
✅ 将功能分离到不同的函数  
✅ 所有代码注释使用中文  
✅ 用户界面文本使用中文  

### 性能优化

✅ 使用防抖保存设置  
✅ 清理事件监听器  
✅ 异步操作使用 async/await  

### 安全性

✅ 验证用户输入  
✅ 使用 DOMPurify 清理 HTML  
❌ 不存储敏感数据在 extensionSettings  
❌ 避免使用 eval()  

### 兼容性

✅ 优先使用 getContext() API  
✅ 使用 SillyTavern 共享库  
✅ 定义最低版本要求  

## 扩展安装

### SillyTavern 自动安装（推荐）

1. 在 SillyTavern 中打开扩展管理器
2. 点击"安装扩展"
3. 输入仓库 URL：`https://github.com/KuangYang452/ST-TRPG-Tool`
4. 点击"安装"
5. 重启 SillyTavern

### 目录结构

SillyTavern 会自动将扩展安装到正确位置：

```
SillyTavern/
└── public/scripts/extensions/third-party/
    └── st-trpg-tool/        # 扩展目录（全小写）
        ├── manifest.json
        ├── index.js
        ├── style.css
        └── .github/
```

**注意**：扩展目录名必须全小写（`st-trpg-tool`），与 manifest.json 中的扩展名一致。

## 调试

在浏览器控制台查看日志：

```javascript
const MODULE_NAME = 'ST-TRPG-Tool';
console.log(`[${MODULE_NAME}] 消息`);
console.error(`[${MODULE_NAME}] 错误`);
```

打开浏览器开发者工具（F12）查看 Console 标签页。

## 参考资源

- [SillyTavern UI 扩展官方文档](https://docs.sillytavern.app/for-contributors/writing-extensions/)
- [扩展示例项目](https://github.com/city-unit/st-extension-example)
- [SillyTavern 官方扩展](https://github.com/search?q=topic%3Aextension+org%3ASillyTavern)
