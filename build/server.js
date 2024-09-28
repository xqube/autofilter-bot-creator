import { Bot, webhookCallback } from "grammy";
import { fastify } from "fastify";
import { autoRetry } from "@grammyjs/auto-retry";
import "dotenv/config";
import { usermongoconnect } from "./db/dbConfig.js";
import { TaskQueue } from "./functions/helperFunctions.js";
import { userComposer } from "./controllers/userComposer.js";
import { mainBotComposer } from "./controllers/mainBotComposer.js";
import { get_db_url_and_fsub_with_botusername } from "./functions/dbFunctions.js";
const app = fastify();
const BotInitTaskQueue = new TaskQueue();
export const botConnectionPool = new Map();
export const botDataPool = new Map();
const { BOT_TOKEN, PORT, WEBHOOK_URL, OWNER } = process.env;
// export const webhookurl = await ngrokurlgen();
export const webhookurl = WEBHOOK_URL;
export const owner = OWNER;
export const mainbot = new Bot(BOT_TOKEN);
export const mainbotres = await mainbot.api.setWebhook(`${webhookurl}/master/${BOT_TOKEN}`, {
    drop_pending_updates: true,
});
mainbot.api.config.use(autoRetry());
mainbot.use(mainBotComposer);
await mainbot.api.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "mybots", description: "Get the list of bots you have." },
]);
app.post(`/master/:token`, async (req, res) => {
    await webhookCallback(mainbot, "fastify")(req, res);
});
app.post("/slave/:token", async (req, res) => {
    try {
        const { token } = req.params;
        let bot = botConnectionPool.get(token);
        if (!bot) {
            BotInitTaskQueue.setNumberOfWorkers(Number(process.env.MASTER_WORKER));
            const initializeBotTask = async () => {
                console.log("Bot not found");
                const bot = new Bot(token);
                bot.api.config.use(autoRetry());
                bot.use(userComposer);
                await bot.api.setMyCommands([
                    { command: "start", description: "Start the bot" },
                    {
                        command: "set_db",
                        description: "Set mongo database, /set_db {link} (owner only)",
                    },
                    {
                        command: "set_fsub",
                        description: "Set fsub, include -100 in id, /set_fsub {-100id} (owner only)",
                    },
                    { command: "remove_fsub", description: "Remove fsub (owner only)" },
                    {
                        command: "set_dbchannel",
                        description: "Set a database channel for file indexing",
                    },
                    {
                        command: "remove_dbchannel",
                        description: "Remove the database channel for file indexing",
                    },
                ]);
                botConnectionPool.set(token, bot);
                const { username } = await bot.api.getMe();
                const { user_id, db_url, f_sub, f_sub_link, db_channel } = await get_db_url_and_fsub_with_botusername(username);
                if (db_url) {
                    try {
                        const user_db = await usermongoconnect(db_url);
                        if (user_db && user_id) {
                            const mapRes = botDataPool.set(username, {
                                user_db,
                                user_id,
                                f_sub,
                                f_sub_link,
                                db_channel,
                            });
                            if (mapRes) {
                                await webhookCallback(bot, "fastify")(req, res);
                            }
                        }
                    }
                    catch (error) {
                        console.log(error.message);
                    }
                }
                else {
                    await webhookCallback(bot, "fastify")(req, res);
                }
            };
            BotInitTaskQueue.enqueue(initializeBotTask);
        }
        else {
            await webhookCallback(bot, "fastify")(req, res);
        }
    }
    catch (error) {
        console.log(error);
    }
});
app.setErrorHandler(async (error) => {
    console.error(error);
});
if (PORT) {
    app.listen({ port: +PORT }, async (error) => {
        if (error) {
            console.error(error);
            process.exit(1);
        }
        console.log(`bot runs at: ${webhookurl}`);
    });
}
