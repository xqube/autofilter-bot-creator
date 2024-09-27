import { Menu } from "@grammyjs/menu";
export const slaveMainMenu = new Menu("bot-root-menu").text("Help", async (ctx) => {
    await ctx.editMessageText(`<b>📚 Essential Commands:</b>\n\n` +
        `/start - <i>Initiate the bot</i> Get started and interact with the bot instantly!\n\n` +
        `/set_db {link} - <i>Set custom database (Owner Only)</i> For bot owners: Personalize your MongoDB connection. ` +
        `<blockquote expandable><b>⚠️ Warning:</b> Once you set the database link, it will be permanently bound to the bot, meaning you <u>cannot delete</u> the link once configured!</blockquote>\n\n` +
        `/set_fsub -100xxxxxxxxx - <i>Enable force subscription (Owner Only)</i> Set a mandatory channel subscription. Remember to include <code>-100</code> in the channel ID!\n\n` +
        `/remove_fsub - <i>Disable force subscription (Owner Only)</i> Remove the force subscription requirement when no longer needed.\n\n` +
        `/set_dbchannel -100xxxxxxxxx - <i>Set a database channel for file indexing (Owner Only)</i> ` +
        `<blockquote expandable>If set, the bot will index files directly from the specified channel on new post. If not set, the bot will only index files from private messages.</blockquote>\n\n` +
        `/remove_dbchannel - <i>Remove the database channel for file indexing (Owner Only)</i> ` +
        `<blockquote expandable>If you no longer wish to index files from the specified channel, use this command to remove the channel setting. The bot will revert to indexing files from private messages only.</blockquote>\n\n` +
        `<i>Need help? Feel free to ask!</i> @TheWatchDogs`, { parse_mode: "HTML", reply_markup: toSlaveMainMenu });
});
export const toSlaveMainMenu = new Menu("to-bot-menu").back("Go Back", async (ctx) => {
    await ctx.editMessageText(`<b>🚀 Welcome to <a href="https://t.me/${ctx.me.username}"><i>${ctx.me.first_name}</i></a>! 🚀</b>\n\n` +
        `An advanced auto-filter bot, powered by @AutoFilterFatherBot.\n\n` +
        `<b>🔍 Key Features:</b>\n` +
        `• Seamless file indexing\n` +
        `• Custom database integration\n` +
        `• Force subscription management`, {
        parse_mode: "HTML",
    });
});
