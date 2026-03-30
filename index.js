// ST-TRPG-Tool UI扩展主脚本
// 为SillyTavern提供TRPG工具箱功能

import { extension_settings, getContext } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

// 扩展基本信息
const extensionName = "st-trpg-tool";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const defaultSettings = {
    diceEnabled: true,
    mapEnabled: false,
    rulesEnabled: false,
    autoRoll: false
};

// 扩展设置
let extensionSettings = extension_settings[extensionName];

/**
 * 加载扩展设置
 */
async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    // 更新UI中的设置
    $("#trpg_dice_enabled").prop("checked", extension_settings[extensionName].diceEnabled).trigger("input");
    $("#trpg_map_enabled").prop("checked", extension_settings[extensionName].mapEnabled).trigger("input");
    $("#trpg_rules_enabled").prop("checked", extension_settings[extensionName].rulesEnabled).trigger("input");
    $("#trpg_auto_roll").prop("checked", extension_settings[extensionName].autoRoll).trigger("input");
}

/**
 * 骰子功能
 */
function rollDice(sides = 6, count = 1) {
    const results = [];
    let total = 0;

    for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * sides) + 1;
        results.push(roll);
        total += roll;
    }

    return { results, total, sides, count };
}

/**
 * 处理骰子按钮点击
 */
function onDiceRollClick() {
    const diceType = $("#trpg_dice_type").val();
    const [count, sides] = diceType.split('d').map(Number);

    const result = rollDice(sides, count);

    // 显示结果
    const resultText = `${count}d${sides}: [${result.results.join(', ')}] = ${result.total}`;
    $("#trpg_dice_result").text(resultText);

    // 如果启用了自动发送到聊天
    if (extension_settings[extensionName].autoRoll) {
        // 这里可以集成到聊天系统中
        toastr.success(`骰子结果: ${result.total}`, "TRPG工具箱");
    }
}

/**
 * 处理设置变更
 */
function onSettingChange(event) {
    const setting = event.target.id.replace('trpg_', '').replace('_', '');
    const value = $(event.target).prop("checked");

    extension_settings[extensionName][setting] = value;
    saveSettingsDebounced();
}

/**
 * 初始化扩展
 */
jQuery(async () => {
    // 加载HTML界面
    const settingsHtml = `
    <div class="trpg-tool-settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>TRPG工具箱</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="trpg-tool-block flex-container">
                    <label for="trpg_dice_enabled">启用骰子功能</label>
                    <input id="trpg_dice_enabled" type="checkbox" />
                </div>

                <div class="trpg-tool-block flex-container">
                    <label for="trpg_map_enabled">启用地图功能</label>
                    <input id="trpg_map_enabled" type="checkbox" />
                </div>

                <div class="trpg-tool-block flex-container">
                    <label for="trpg_rules_enabled">启用规则书查询</label>
                    <input id="trpg_rules_enabled" type="checkbox" />
                </div>

                <div class="trpg-tool-block flex-container">
                    <label for="trpg_auto_roll">自动发送骰子结果到聊天</label>
                    <input id="trpg_auto_roll" type="checkbox" />
                </div>

                <div class="trpg-dice-section" style="margin-top: 10px;">
                    <select id="trpg_dice_type">
                        <option value="1d6">1d6</option>
                        <option value="1d20">1d20</option>
                        <option value="2d6">2d6</option>
                        <option value="3d6">3d6</option>
                    </select>
                    <button id="trpg_roll_dice" class="menu_button">投骰子</button>
                    <div id="trpg_dice_result" style="margin-top: 5px; font-weight: bold;"></div>
                </div>

                <hr class="sysHR" />
            </div>
        </div>
    </div>`;

    // 添加到设置面板
    $("#extensions_settings").append(settingsHtml);

    // 绑定事件监听器
    $("#trpg_roll_dice").on("click", onDiceRollClick);
    $("#trpg_dice_enabled, #trpg_map_enabled, #trpg_rules_enabled, #trpg_auto_roll").on("input", onSettingChange);

    // 加载设置
    loadSettings();

    console.log("🎲 ST-TRPG-Tool 扩展已加载！");
});