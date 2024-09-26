import { Bot, Context, InlineKeyboard } from "grammy";
import { db, get_cache_db, search_document } from "./dbFunctions.js";
import ngrok from "@ngrok/ngrok";
import crypto from "crypto";
import { botConnectionPool, botDataPool, webhookurl } from "../server.js";
import { BotsList } from "../model/types.js";

const { PORT, SECRET_TOKEN } = process.env;

export class Queue<T> {
  protected items: T[] = [];
  enqueue(element: T): void {
    this.items.push(element);
  }
  dequeue(): T | undefined {
    return this.items.shift();
  }
  peek(): T | undefined {
    return this.items[0];
  }
  isEmpty(): boolean {
    return this.items.length === 0;
  }
  size(): number {
    return this.items.length;
  }
  clear(): void {
    this.items = [];
  }
  print(): void {
    console.log(this.items.toString());
  }
}

export class TaskQueue extends Queue<() => Promise<void>> {
  private activeWorkers: number = 0;
  private isProcessing: boolean = false;
  private numWorkers: number = 1; // Default to 1 worker
  constructor() {
    super();
  }
  setNumberOfWorkers(num: number): void {
    if (num < 1) {
      throw new Error("Number of workers must be at least 1");
    }
    this.numWorkers = num;
    // If we're increasing the number of workers, we might need to start more tasks
    if (this.isProcessing) {
      this.processQueue();
    }
  }
  getNumberOfWorkers(): number {
    return this.numWorkers;
  }
  async enqueue(task: () => Promise<void>): Promise<void> {
    super.enqueue(task);
    this.processQueue();
  }
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    while (!this.isEmpty()) {
      while (this.activeWorkers < this.numWorkers && !this.isEmpty()) {
        this.activeWorkers++;
        this.processTask();
      }
      await new Promise((resolve) => setTimeout(resolve, 0)); // Allow other operations to occur
    }
    this.isProcessing = false;
  }
  private async processTask(): Promise<void> {
    const task = this.dequeue();
    if (task) {
      try {
        await task();
      } catch (error) {
        console.error("Error executing task:", error);
      } finally {
        this.activeWorkers--;
        this.processQueue(); // Check if there are more tasks to process
      }
    }
  }
  async waitForCompletion(): Promise<void> {
    return new Promise<void>((resolve) => {
      const checkCompletion = () => {
        if (this.isEmpty() && this.activeWorkers === 0) {
          resolve();
        } else {
          setTimeout(checkCompletion, 100);
        }
      };
      checkCompletion();
    });
  }
}

export async function keyboardlist(
  ctx: any,
  page: number,
  searchTerm: string,
  botusername: string
) {
  try {
    const inlineKeyboard = new InlineKeyboard();

    const { filteredDocs, totalsize } = await search_document(
      searchTerm,
      page,
      botusername
    );
    const totalPages = Math.ceil(totalsize / 10);
    // Display paginated data
    if (filteredDocs.length === 0) {
      await ctx.reply("No Document found.");
      return;
    } else {
      filteredDocs.map(async (doc: any) => {
        const file_size = bytesToMegabytes(doc.file_size);
        inlineKeyboard
          .text(doc.file_name, `file::${doc.file_unique_id}`) //changed it to __ coz fileid can have an underscore
          .text(file_size.toFixed(1) + "MB 📩", `doc::${doc.file_unique_id}`)
          .row();
      });
    }
    if (page == 1 && page < totalPages) {
      inlineKeyboard.text("Next>>", `^next::${page}`).row();
    } else if (page > 1 && page < totalPages) {
      inlineKeyboard
        .text("<<Prev", `^prev::${page}`)
        .text(`${page}/${totalPages}📄`)
        .text("Next>>", `^next::${page}`)
        .row();
    } else if (page == totalPages && page != 1) {
      inlineKeyboard.text("<<Prev", `^prev::${page}`);
    }
    return inlineKeyboard;
  } catch (error: any) {
    console.log("Error at keyboardlist in helperFunc.ts", error.message);
  }
}

export function bytesToMegabytes(bytes: number) {
  return bytes / (1024 * 1024);
}

export function cleanFileName(fileName: any): string {
  // Define a regular expression pattern to match characters to be removed
  const pattern = /[_.,\[\]\|\\\/\?\>\<\+\=\-\!\@\#\$\%\^\&\*\(\)\~\`\{\}\s]+/g;
  // Remove special characters
  let cleanedFileName = fileName.replace(pattern, " ");
  // Replace consecutive spaces with a single space
  cleanedFileName = cleanedFileName.replace(/\s{2,}/g, " ");
  return cleanedFileName;
}

export function extractSearchTerm(searchString: string) {
  // Define a regular expression pattern to match the term after "Searched For:"
  const regexPattern = /Searched For:\s*(.+)/i;
  // Use the match method with the regular expression pattern
  const match = searchString.match(regexPattern);
  // Extract the term after "Searched For:"
  const termAfterSearchedFor = match ? match[1] : null;
  return termAfterSearchedFor;
}

export const ngrokurlgen = async () => {
  const listener = await ngrok.forward({
    addr: PORT,
    authtoken: SECRET_TOKEN,
  });

  return listener.url();
};

export function gethash(input: string) {
  // Create a hash object using the sha256 algorithm
  const hash = crypto.createHash("sha256");

  // Update the hash object with the input data
  hash.update(input);

  // Compute the hash digest in hexadecimal format
  return hash.digest("base64url");
}


export const startbots = async (ctx: Context) => {
  try {
    const taskQueue = new TaskQueue();
    taskQueue.setNumberOfWorkers(Number(process.env.SLAVE_WORKER));

    const startBotsTask = (): Promise<void> =>
      new Promise(async (resolve) => {
        let page = 1;
        let users = 0; // Tracks the total number of processed users
        let bots = 0;
        let errorbots = 0;
        const batchSize = 100; // Number of documents to process per batch
        const totalsize = await db.UserCollection.countDocuments();

        while (users < totalsize) {
          const skip = (page - 1) * batchSize;
          const filteredDocs = await db.UserCollection.find()
            .skip(skip)
            .limit(batchSize)
            .toArray();

          if (filteredDocs.length === 0) {
            break; // Exit loop if no documents are found
          }

          for (const doc of filteredDocs) {
            const botsList = doc?.bots as BotsList;
            if (botsList) {
              for (const [bot_username, botInfo] of Object.entries(botsList)) {
                const token = botInfo?.bot_token;
                if (token) {
                  const bot = new Bot(token);
                  try {
                    const res = await bot.api.setWebhook(
                      `${webhookurl}/slave/${token}`,
                      {
                        drop_pending_updates: true,
                      }
                    );
                    if (res) {
                      bots += 1;
                    }
                  } catch (error: any) {
                    errorbots += 1;
                    console.log(
                      `Error with bot ${bot_username}: ${error.message}`
                    );
                  }
                }
              }
            }
          }

          users += filteredDocs.length; // Increment users by the number of documents processed
          page += 1; // Move to the next page
        }

        // After processing all users, send the final summary
        await ctx.reply(
          `Total users: ${totalsize}, Total Bots: ${bots}, Error Bots: ${errorbots}`
        );

        resolve(); // Resolve the promise after all bots are processed
      });

    taskQueue.enqueue(startBotsTask);
    // Execute tasks in the queue
  } catch (error: any) {
    console.log("Error starting bots:", error.message);
  }
};

export const stopbots = async (ctx: Context) => {
  try {
    const taskQueue = new TaskQueue();
    taskQueue.setNumberOfWorkers(Number(process.env.SLAVE_WORKER));

    const stopBotsTask = (): Promise<void> =>
      new Promise(async (resolve) => {
        let page = 1;
        let users = 0;
        let bots = 0;
        let errorbots = 0;
        const batchSize = 100; // Number of documents to process per batch
        const totalsize = await db.UserCollection.countDocuments();

        while (users < totalsize) {
          const skip = (page - 1) * batchSize;
          const filteredDocs = await db.UserCollection.find()
            .skip(skip)
            .limit(batchSize)
            .toArray();

          if (filteredDocs.length === 0) {
            break; // Exit loop if no documents are found
          }

          for (const doc of filteredDocs) {
            const botsList = doc?.bots as BotsList;

            if (botsList) {
              for (const [bot_username, botInfo] of Object.entries(botsList)) {
                const token = botInfo?.bot_token;
                if (token) {
                  const bot = new Bot(token);
                  try {
                    const res = await bot.api.deleteWebhook();
                    if (res) {
                      botConnectionPool.delete(token); // Clear bot connection
                      bots += 1;
                    }
                  } catch (error: any) {
                    errorbots += 1;
                    console.log(
                      `Error with bot ${bot_username}: ${error.message}`
                    );
                  }
                }

                const user_db = await get_cache_db(bot_username);
                if (user_db) {
                  try {
                    await user_db.mongoclient.close();
                    console.log(
                      "Database connection closed for bot:",
                      bot_username
                    );
                    botDataPool.delete(bot_username); // Remove from botDataPool after closing
                  } catch (error: any) {
                    console.error(
                      `Error closing database for bot ${bot_username}:`,
                      error.message
                    );
                  }
                } else {
                  console.error(`Database not found for bot ${bot_username}`);
                }
              }
            }
          }

          users += filteredDocs.length; // Increment users after processing each batch
          page += 1; // Move to the next page
        }

        // Send final summary after all users/bots are processed
        await ctx.reply(
          `Total users: ${totalsize}, Total Bots: ${bots}, Error Bots: ${errorbots}`
        );

        resolve(); // Resolve the promise after the task is complete
      });

    // Enqueue the stop bots task
    taskQueue.enqueue(stopBotsTask);
    // Execute tasks in the queue
  } catch (error: any) {
    console.log("Error stopping bots:", error.message);
  }
};
