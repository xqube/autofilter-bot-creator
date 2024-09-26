import { Menu, MenuRange } from "@grammyjs/menu";
import {
  delete_bot_token,
  get_bot_token,
  get_bot_usernames,
  get_cache_db,
} from "../functions/dbFunctions.js";
import { Bot } from "grammy";
import { botConnectionPool, botDataPool } from "../server.js";

export const MybotListMenu = new Menu("master-my-bots-menu").dynamic(async (ctx) => {
  if (ctx) {
    if (ctx.from) {
      const bots = await get_bot_usernames(ctx.from.id);
      // Generate a part of the menu dynamically!
      const range = new MenuRange();
      if (bots) {
        bots.forEach((element) => {
          range.text(`${element}`, async (ctx) => {
            await ctx.editMessageText(
              `What do you want to do with the bot? @${element}`,
              {
                reply_markup: botSettings,
              }
            );
          });
        });
      }
      return range;
    }
  }
});

export const botSettings = new Menu("master-my-bot-prop")
  .text("Delete bot", async (ctx) => {
    const str = ctx.update.callback_query.message?.text;
    if (str) {
      const botUsername = str.match(/@(\w+)/)?.[1]; // Extracts the word after the '@'
      await ctx.editMessageText(`Are you sure to delete? @${botUsername}`, {
        reply_markup: botDeleteMenu,
      });
    }
  })
  .row()
  .back("Go Back", async (ctx) => {
    await ctx.editMessageText(`Choose a bot from the list below:`);
  });

export const botDeleteMenu = new Menu("bot-delete-menu")
  .text("Yes delete Bot, 100%", async (ctx) => {
    const str = ctx.update.callback_query.message?.text;

    if (str) {
      const botUsername = str.match(/@(\w+)/)?.[1]; // Extracts the word after the '@'
      if (ctx.from.id && botUsername) {
        const bot_token = await get_bot_token(ctx.from.id, botUsername);
        if (bot_token) {
          const bot = new Bot(bot_token);
          if (bot) {
            try {
              const webhookres = await bot.api.deleteWebhook({
                drop_pending_updates: true,
              });
            } catch (error: any) {
              console.log(error.message);
            }
            const { res } = await delete_bot_token(ctx.from.id, botUsername);
            // botConnectionPool.delete(bot_token);
            if (res) {
              const user_db = await get_cache_db(botUsername);
              if (user_db) {
                botDataPool.delete(botUsername);
                botConnectionPool.delete(bot_token);
                try {
                  await user_db.mongoclient.close();
                  console.log("Database connection closed");
                } catch (error: any) {
                  console.error(error.description);
                }
              }
              await ctx.editMessageText(
                `The bot ${botUsername} was successfully deleted.`,
                { reply_markup: toMasterMainMenu }
              );
            } else {
              await ctx.editMessageText("Got error while deleting bot");
            }
          }
        }
      }
    }
  })
  .back("Go Back", async (ctx) => {
    const str = ctx.update.callback_query.message?.text;
    if (str) {
      const botUsername = str.match(/@(\w+)/)?.[1]; // Extracts the word after the '@'
      if (botUsername) {
        await ctx.editMessageText(
          `What do you want to do with the bot? @${botUsername}`
        );
      }
    }
  });

export const toMasterMainMenu = new Menu("to-master-my-bots-menu").text("Go Back", async(ctx) => {
  const bots = await get_bot_usernames(ctx.from.id);
  if(bots){
    await ctx.editMessageText(`Choose a bot from the list below:`, {
      reply_markup: MybotListMenu,
    });
  }else{
    await ctx.deleteMessage();
    await ctx.reply("You don't have any bots")
  }

});
