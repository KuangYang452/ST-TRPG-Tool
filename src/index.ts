import bodyParser from 'body-parser';
import { Router } from 'express';
import { Chalk } from 'chalk';

interface PluginInfo {
    id: string;
    name: string;
    description: string;
}

interface Plugin {
    init: (router: Router) => Promise<void>;
    exit: () => Promise<void>;
    info: PluginInfo;
}

const chalk = new Chalk();
const MODULE_NAME = '[ST-TRPG-Tool]';

/**
 * 初始化插件，注册所有路由处理器。
 * @param router Express Router - SillyTavern 提供的路由实例
 */
export async function init(router: Router): Promise<void> {
    const jsonParser = bodyParser.json();
    
    // 探针端点：用于检查插件是否正在运行
    router.post('/probe', (_req, res) => {
        return res.sendStatus(204);
    });
    
    // 心跳检测端点：验证基本的请求-响应流程
    router.post('/ping', jsonParser, async (req, res) => {
        try {
            const { message } = req.body;
            return res.json({ message: `Pong! ${message}` });
        } catch (error) {
            console.error(chalk.red(MODULE_NAME), '请求失败', error);
            return res.status(500).send('内部服务器错误');
        }
    });

    console.log(chalk.green(MODULE_NAME), '插件已加载！');
}

/**
 * 插件关闭时调用，用于清理资源。
 */
export async function exit(): Promise<void> {
    console.log(chalk.yellow(MODULE_NAME), '插件已卸载');
    return Promise.resolve();
}

export const info: PluginInfo = {
    id: 'st-trpg-tools',
    name: 'ST-TRPG-Tools',
    description: '这是一个开发中的插件，预计将用来给智能体提供跑团用的工具箱，如骰子、地图、规则书、角色卡查询等等。',
};

const plugin: Plugin = {
    init,
    exit,
    info,
};

export default plugin;
