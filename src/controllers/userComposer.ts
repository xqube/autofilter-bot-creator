import { Composer, Context, InlineKeyboard } from "grammy";
import {
  get_db_url_with_id_and_botusername,
  get_cache_fsub,
  insert_file,
  insert_user_on_slave,
  remove_f_sub,
  search_file_id,
  set_db_url,
  set_f_sub,
  get_cache_fsub_link,
  set_db_channel,
  get_cache_db_channel,
  get_cache_user_id,
  remove_db_channel,
  updateBotData,
  checkUserMembership,
} from "../functions/dbFunctions.js";

import {
  cleanFileName,
  extractSearchTerm,
  keyboardlist,
  TaskQueue,
} from "../functions/helperFunctions.js";
import { usermongoconnect } from "../db/dbConfig.js";
import { botDataPool } from "../server.js";
import { slaveMainMenu, toSlaveMainMenu } from "../buttons/slaveButton.js";

export const userComposer = new Composer<Context>();

slaveMainMenu.register(toSlaveMainMenu);
userComposer.use(slaveMainMenu);

userComposer.on("callback_query:data", async (ctx: any) => {
  try {
    const calldata = ctx.update.callback_query.data;
    const botusername = ctx.me.username;
    const calladatanext = calldata.match(/\^next/);
    const calladataprev = calldata.match(/\^prev/);
    const calladatafile = calldata.match(/file/);
    const nulldata = calldata.match(/null/);
    const messageText = ctx.update.callback_query.message?.text;
    const searchTerm: any = extractSearchTerm(messageText!);
    const data = calldata.split("::");

    /////below code is for the file name button click
    const filetype = data[0];
    const file_unique_id = data[1];

    if (filetype == "doc") {
      await ctx.answerCallbackQuery({
        url: `https://t.me/${botusername}?start=doc-_-${file_unique_id}`,
      });
    }
    if (filetype == "try") {
      const f_sub = await get_cache_fsub(ctx.me.username);
      if (f_sub) {
        const isMember = await checkUserMembership(
          ctx,
          Number(f_sub),
          ctx.from.id
        );
        console.log("loging member here",isMember);
        
        if (isMember) {
          const { filteredDocs } = await search_file_id(
            file_unique_id,
            ctx.me.username
          );
          await ctx.replyWithDocument(filteredDocs.file_id, {
            caption: filteredDocs.file_name,
          });
        } else {
          await ctx.answerCallbackQuery({
            text: `Hmm nice try...`,
            show_alert: true,
          });
        }
      }
      await ctx.answerCallbackQuery();
    }

    if (calladatafile) {
      const { filteredDocs } = await search_file_id(
        file_unique_id,
        ctx.me.username
      );
      await ctx.answerCallbackQuery({
        text: `${filteredDocs.file_name}`,
        show_alert: true,
      });
    } else if (calladatanext) {
      const page = Number(data[1]);
      const nextpage = page + 1;
      const inlineKeyboard = await keyboardlist(
        ctx,
        nextpage,
        searchTerm,
        botusername
      );
      await ctx.editMessageText(
        `Hey <a href="tg://user?id=${ctx.update.callback_query.message.entities[0].user.id}">${ctx.update.callback_query.message.entities[0].user.first_name}</a> , You Searched For: <code>${searchTerm}</code>`,
        {
          reply_markup: inlineKeyboard,
          parse_mode: "HTML",
        }
      );
    }
    //get prev page
    else if (calladataprev) {
      const page = Number(data[1]);
      const prevpage = page - 1;
      const inlineKeyboard = await keyboardlist(
        ctx,
        prevpage,
        searchTerm,
        botusername
      );
      await ctx.editMessageText(
        `Hey <a href="tg://user?id=${ctx.update.callback_query.message.entities[0].user.id}">${ctx.update.callback_query.message.entities[0].user.first_name}</a> , You Searched For: <code>${searchTerm}</code>`,
        {
          reply_markup: inlineKeyboard,
          parse_mode: "HTML",
        }
      );
    } else if (nulldata) {
      await ctx.answerCallbackQuery();
    }
  } catch (error: any) {
    console.log("Error in callback_query:data at UserComposer", error.message);
  }
});

//////////////////////////////////////////////////////////////////////////////////////////

userComposer.chatType("private").command("start", async (ctx) => {
  try {
    const data = {
      user_id: ctx.from.id,
      first_name: ctx.from.first_name,
    };
    await insert_user_on_slave(data, ctx.me.username);
    if (ctx.match) {
      if (ctx.match == "start") {
        await ctx.reply(
          `<b>🚀 Welcome to <a href="https://t.me/${ctx.me.username}"><i>${ctx.me.first_name}</i></a>! 🚀</b>\n\n` +
            `An advanced auto-filter bot, powered by @AutoFilterFatherBot.\n\n` +
            `<b>🔍 Key Features:</b>\n` +
            `• Seamless file indexing\n` +
            `• Custom database integration\n` +
            `• Force subscription management`,
          {
            reply_markup: slaveMainMenu,
            parse_mode: "HTML",
          }
        );
      } else {
        const parts = ctx.match.split("-_-");
        const file_unique_id = parts[1];
        const type = parts[0];
        const f_sub = await get_cache_fsub(ctx.me.username);
        if (f_sub) {
          const isMember = await checkUserMembership(
            ctx,
            Number(f_sub),
            ctx.from.id
          );
          console.log("loging member here",isMember);
          if (type == "doc") {
            if (isMember) {
              const { filteredDocs } = await search_file_id(
                file_unique_id,
                ctx.me.username
              );
              await ctx.replyWithDocument(filteredDocs.file_id, {
                caption: filteredDocs.file_name,
              });
            } else {
              const inlineKeyboard = new InlineKeyboard();
              const inviteLink = await get_cache_fsub_link(ctx.me.username);
              if (inviteLink) {
                inlineKeyboard
                  .url("Chat 1", `${process.env.FORCE_SUB_LINK}`)
                  .url("Chat 2", `${inviteLink}`)
                  .row()
                  .text("try again", `try::${file_unique_id}`); //changed it to :: coz fileid can have an underscore
                await ctx.reply(
                  `<b>⚠️ It seems you’re not a member of the update channels!</b>\n\n` +
                    `🔗 <i>To continue using the bot, please join the required channels listed below:</i>\n\n` +
                    `Once you've joined, simply press the <b>Try Again</b> button to get the file.`,
                  { reply_markup: inlineKeyboard, parse_mode: "HTML" }
                );
              }
            }
          }
        } else {
          if (type == "doc") {
            const { filteredDocs } = await search_file_id(
              file_unique_id,
              ctx.me.username
            );
            await ctx.replyWithDocument(filteredDocs.file_id, {
              caption: filteredDocs.file_name,
            });
          }
        }
      }
    } else {
      await ctx.reply(
        `<b>🚀 Welcome to <a href="https://t.me/${ctx.me.username}"><i>${ctx.me.first_name}</i></a>! 🚀</b>\n\n` +
          `An advanced auto-filter bot, powered by @AutoFilterFatherBot.\n\n` +
          `<b>🔍 Key Features:</b>\n` +
          `• Seamless file indexing\n` +
          `• Custom database integration\n` +
          `• Force subscription management`,
        {
          reply_markup: slaveMainMenu,
          parse_mode: "HTML",
        }
      );
    }
  } catch (error: any) {
    console.log(error.message);
  }
});

userComposer.chatType("private").command("info", async (ctx, next) => {
  try {
    if (ctx.msg.chat.type == "private") {
      const replyMessage = ctx.msg.reply_to_message;
      if (
        replyMessage?.document ||
        replyMessage?.video ||
        replyMessage?.audio
      ) {
        if (replyMessage.document) {
          await ctx.reply(
            `<pre language="json">id: ${replyMessage.document.file_unique_id}</pre>`,
            { parse_mode: "HTML" }
          );
        } else if (replyMessage.video) {
          await ctx.reply(
            `<pre language="json">id: ${replyMessage.video.file_unique_id}</pre>`,
            { parse_mode: "HTML" }
          );
        } else if (replyMessage.audio) {
          await ctx.reply(
            `<pre language="json">id: ${replyMessage.audio.file_unique_id}</pre>`,
            { parse_mode: "HTML" }
          );
        }
      } else {
        await ctx.reply(
          "Please reply to a message containing a document, video, or audio."
        );
      }
    }
  } catch (error: any) {
    console.log(error.message);
  }
  await next();
});

userComposer.chatType("private").command("set_db", async (ctx) => {
  try {
    if (ctx.match) {
      const url = await get_db_url_with_id_and_botusername(
        ctx.chat.id,
        ctx.me.username
      );
      if (!url) {
        const userdb = await usermongoconnect(ctx.match);
        if (userdb) {
          const res = await set_db_url(ctx.from.id, ctx.match, ctx.me.username);
          if (res) {
            await ctx.reply("DB connected successfully");
            updateBotData(ctx.me.username, ctx.from.id, { user_db: userdb });
          }
        }
      } else {
        await ctx.reply("you already have a connected db for this bot");
      }
    }
  } catch (error: any) {
    console.log(error.message);
  }
});

userComposer.chatType("private").command("set_fsub", async (ctx) => {
  try {
    if (ctx.match) {
      const f_sub = Number(ctx.match);
      const inviteLink = await ctx.api.exportChatInviteLink(f_sub);
      if (inviteLink) {
        // existingData.user_db = existingData.user_db;
        const res = await set_f_sub(
          ctx.from.id,
          f_sub,
          inviteLink,
          ctx.me.username
        );
        if (res) {
          updateBotData(ctx.me.username, ctx.from.id, {
            f_sub: f_sub,
            f_sub_link: inviteLink,
          });
          await ctx.reply("fsub saved successfully");
        }
      } else {
        await ctx.reply("Make sure the bot is admin in the chat");
      }
    }
  } catch (error: any) {
    console.log(error.message);
  }
});

userComposer.chatType("private").command("set_dbchannel", async (ctx) => {
  try {
    if (ctx.match) {
      const db_channel = Number(ctx.match);
      const inviteLink = await ctx.api.exportChatInviteLink(db_channel);
      if (inviteLink) {
        const res = await set_db_channel(
          ctx.from.id,
          db_channel,
          ctx.me.username
        );
        if (res) {
          updateBotData(ctx.me.username, ctx.from.id, {
            db_channel: db_channel,
          });
          await ctx.reply("DB Channel saved successfully");
        }
      } else {
        await ctx.reply("Make sure the bot is admin in the chat");
      }
    }
  } catch (error: any) {
    console.log(error.message);
  }
});

userComposer.chatType("private").command("remove_fsub", async (ctx) => {
  try {
    const res = await remove_f_sub(ctx.from.id, ctx.me.username);
    if (res) {
      updateBotData(ctx.me.username, ctx.from.id, {
        f_sub: null,
      });
      await ctx.reply("fsub removed successfully");
    }
  } catch (error: any) {
    console.log(error.message);
  }
});

userComposer.chatType("private").command("remove_dbchannel", async (ctx) => {
  try {
    const res = await remove_db_channel(ctx.from.id, ctx.me.username);
    if (res) {
      updateBotData(ctx.me.username, ctx.from.id, {
        db_channel: null,
      });
      await ctx.reply("DB Channel removed successfully");
    }
  } catch (error: any) {
    console.log(error.message);
  }
});

userComposer.chatType(["channel", "private"]).on(":file", async (ctx, next) => {
  try {
    const db_channel = await get_cache_db_channel(ctx.me.username);
    const user_id = await get_cache_user_id(ctx.me.username);
    if (ctx.chat.id == db_channel) {
      if (ctx.msg.document) {
        const file_name = cleanFileName(ctx.msg.document.file_name);
        const data = {
          file_id: ctx.msg.document.file_id,
          file_name: file_name,
          file_unique_id: ctx.msg.document.file_unique_id,
          file_size: ctx.msg.document.file_size,
        };
        await insert_file(data, ctx.me.username);
      } else if (ctx.msg.video) {
        const file_name = cleanFileName(ctx.msg.video.file_name);
        const data = {
          file_id: ctx.msg.video.file_id,
          file_name: file_name,
          file_unique_id: ctx.msg.video.file_unique_id,
          file_size: ctx.msg.video.file_size,
        };
        await insert_file(data, ctx.me.username);
      }
    } else if (ctx.chat.id == user_id) {
      if (ctx.msg.document) {
        const file_name = cleanFileName(ctx.msg.document.file_name);
        const data = {
          file_id: ctx.msg.document.file_id,
          file_name: file_name,
          file_unique_id: ctx.msg.document.file_unique_id,
          file_size: ctx.msg.document.file_size,
        };
        await insert_file(data, ctx.me.username);
      } else if (ctx.msg.video) {
        const file_name = cleanFileName(ctx.msg.video.file_name);
        const data = {
          file_id: ctx.msg.video.file_id,
          file_name: file_name,
          file_unique_id: ctx.msg.video.file_unique_id,
          file_size: ctx.msg.video.file_size,
        };
        await insert_file(data, ctx.me.username);
      }
    }
  } catch (error: any) {
    console.log(error.message);
  }
  await next();
});

userComposer.chatType("private").on(":text", async (ctx, next) => {
  try {
    const taskQueue = new TaskQueue();
    taskQueue.setNumberOfWorkers(Number(process.env.SLAVE_WORKER));
    const textSearchTask = async (): Promise<void> => {
      if (ctx.chat.type == "private") {
        const botusername = ctx.me.username;
        const searchparam = ctx.msg.text;
        const inlineKeyboard = await keyboardlist(
          ctx,
          1,
          searchparam,
          botusername
        );
        if (inlineKeyboard) {
          await ctx.reply(
            `Hey <a href="tg://user?id=${ctx.from?.id}">${ctx.from?.first_name}</a> , You Searched For: <code>${searchparam}</code>`,
            {
              reply_markup: inlineKeyboard,
              parse_mode: "HTML",
            }
          );
        }
      } else if (ctx.chat.type == "group" || ctx.chat.type == "supergroup") {
        const botusername = ctx.me.username;
        const searchparam = ctx.msg.text;
        const inlineKeyboard = await keyboardlist(
          ctx,
          1,
          searchparam,
          botusername
        );
        if (inlineKeyboard) {
          await ctx.reply(
            `Hey <a href="tg://user?id=${ctx.from?.id}">${ctx.from?.first_name}</a> , You Searched For: <code>${searchparam}</code>`,
            {
              reply_markup: inlineKeyboard,
              parse_mode: "HTML",
            }
          );
        }
      }
    };
    taskQueue.enqueue(textSearchTask);
  } catch (error: any) {
    console.log(error.message);
  }
  await next();
});
