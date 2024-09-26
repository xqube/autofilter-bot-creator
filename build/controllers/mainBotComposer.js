import { Composer, InlineKeyboard } from "grammy";
import { startbots, stopbots } from "../functions/helperFunctions.js";
import { Bot } from "grammy";
import { count_user_bots, get_bot_usernames, set_bot, updateBotData, } from "../functions/dbFunctions.js";
import { mainbot, mainbotres, owner, webhookurl } from "../server.js";
import { botDeleteMenu, botSettings, MybotListMenu, toMasterMainMenu, } from "../buttons/masterButton.js";
export const mainBotComposer = new Composer();
mainBotComposer.chatType(["private"]).command("start", async (ctx) => {
    try {
        const botname = ctx.me.first_name;
        await ctx.reply(`<b>👋 Greetings!</b>\n\n` +
            `I am <b>${botname}</b>, your go-to assistant for creating powerful auto-filter bots effortlessly.\n\n` +
            `To get started with the bot creation process, please forward the message from <code>@BotFather</code> that confirms your bot's successful creation.\n\n` +
            `<i>Need assistance? Feel free to reach out!</i> @TheWatchDogs`, { parse_mode: "HTML" });
    }
    catch (error) {
        console.log(error.message);
    }
});
function extractBotToken(msgText, entities) {
    // https://github.com/wjclub/telegram-bot-tokenextract/pull/1
    for (const entity_ in entities) {
        const entity = entities[Number(entity_)];
        if (entity.type == "code") {
            return msgText === null || msgText === void 0 ? void 0 : msgText.substring(entity.offset, entity.offset + entity.length);
        }
    }
}
function extractBotUsername(msgText, entities) {
    // https://github.com/wjclub/telegram-bot-tokenextract/pull/1
    for (const entity_ in entities) {
        const entity = entities[Number(entity_)];
        if (entity.type == "mention") {
            const botusername = msgText === null || msgText === void 0 ? void 0 : msgText.substring(entity.offset, entity.offset + entity.length);
            return botusername.replace("@", "");
        }
        else if (entity.type == "url") {
            const botusername = msgText === null || msgText === void 0 ? void 0 : msgText.substring(entity.offset, entity.offset + entity.length);
            return botusername.replace("t.me/", "");
        }
    }
}
mainBotComposer
    .chatType("private")
    .on("message:forward_origin", async (ctx) => {
    var _a, _b;
    try {
        const inlineKeyboard = new InlineKeyboard();
        const user_id = ctx.chat.id;
        if (ctx.msg.forward_origin.type == "user")
            if (ctx.msg.forward_origin.sender_user.id == 93372553) {
                const number_of_bot = await count_user_bots(user_id);
                if (number_of_bot < 3) {
                    if (ctx.msg.text) {
                        const entities = ((_a = ctx.message) === null || _a === void 0 ? void 0 : _a.entities) || [];
                        const msgText = ((_b = ctx.message) === null || _b === void 0 ? void 0 : _b.text) || "";
                        const botToken = extractBotToken(msgText, entities);
                        const botUsername = extractBotUsername(msgText, entities);
                        if (botToken && botUsername) {
                            let bot = new Bot(botToken);
                            const webhookres = await bot.api.setWebhook(`${webhookurl}/slave/${botToken}`, {
                                drop_pending_updates: true,
                            });
                            if (webhookres) {
                                const res = await set_bot(user_id, botToken, botUsername);
                                if (res) {
                                    updateBotData(ctx.me.username, ctx.from.id, {
                                        user_id: user_id,
                                    });
                                    inlineKeyboard
                                        .url(`Go to @${botUsername}`, `https://t.me/${botUsername}?start=start`)
                                        .row();
                                    ctx.reply(`The bot was successfully added`, {
                                        parse_mode: "HTML",
                                        reply_markup: inlineKeyboard,
                                    });
                                }
                                else {
                                    ctx.reply("Got something wrong, /deletebot and try to re-register it");
                                }
                            }
                            else {
                                await ctx.reply("Make sure the bot is not connected to any other services");
                            }
                        }
                        else {
                            await ctx.reply("Can't get username or bot token from the given messsage");
                        }
                    }
                }
                else {
                    await ctx.reply("You have reached the limtit");
                }
            }
            else {
                await ctx.reply("try to Forward the message from bot father with forward tag");
            }
    }
    catch (error) {
        console.log(error.message);
    }
});
botDeleteMenu.register(toMasterMainMenu);
botSettings.register(botDeleteMenu);
MybotListMenu.register(botSettings);
mainBotComposer.use(MybotListMenu);
mainBotComposer.chatType("private").command("mybots", async (ctx) => {
    try {
        const bots = await get_bot_usernames(ctx.from.id);
        if (bots) {
            await ctx.reply("Choose a bot from the list below:", {
                reply_markup: MybotListMenu,
            });
        }
        else {
            await ctx.reply("You don't have any bots");
        }
    }
    catch (error) {
        console.error(error.description);
    }
});
/////////////////////////////////////////////////////////////////////////////////////////////
mainBotComposer.chatType(["private"]).command("startbots", async (ctx) => {
    try {
        if (ctx.from.id == owner) {
            if (mainbotres) {
                await ctx.reply("Bots all going to start");
                await startbots(ctx);
            }
        }
    }
    catch (error) {
        console.log(error.message);
    }
});
mainBotComposer.chatType(["private"]).command("stopbots", async (ctx) => {
    try {
        if (ctx.from.id == owner) {
            if (mainbotres) {
                await ctx.reply("Bots all going to stop");
                await stopbots(ctx);
            }
        }
    }
    catch (error) {
        console.log(error.message);
    }
});
mainBotComposer.chatType(["private"]).command("terminate", async (ctx) => {
    try {
        if (ctx.from.id == owner) {
            if (mainbotres) {
                const webhookres = await mainbot.api.deleteWebhook({
                    drop_pending_updates: true,
                });
                if (webhookres) {
                    await ctx.reply("Deletion successfull");
                }
            }
        }
    }
    catch (error) {
        console.log(error.message);
    }
});
