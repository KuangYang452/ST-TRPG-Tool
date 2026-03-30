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
const MODULE_NAME = '[SillyTavern-Example-Plugin]';

/**
 * 初始化插件。
 * @param router Express Router
 */
export async function init(router: Router): Promise<void> {
    const jsonParser = bodyParser.json();
    // 用于检查服务器插件是否正在运行
    router.post('/probe', (_req, res) => {
        return res.sendStatus(204);
    });
    // 使用body-parser解析请求正文
    router.post('/ping', jsonParser, async (req, res) => {
        try {
            const { message } = req.body;
            return res.json({ message: `Pong! ${message}` });
        } catch (error) {
            console.error(chalk.red(MODULE_NAME), 'Request failed', error);
            return res.status(500).send('Internal Server Error');
        }
    });

    console.log(chalk.green(MODULE_NAME), 'Plugin loaded!');
}

export async function exit(): Promise<void> {
    console.log(chalk.yellow(MODULE_NAME), 'Plugin exited');
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
