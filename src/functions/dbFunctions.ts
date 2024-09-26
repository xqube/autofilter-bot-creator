import { Context } from "grammy";
import { mongoconnect, usermongoconnect } from "../db/dbConfig.js";
import { botData, UserDB } from "../model/types.js";
import { botDataPool } from "../server.js";

export const db = await mongoconnect();
if (db) {
  console.log("Connected successfully to DB server");
}

export async function insert_user(data: object) {
  try {
    const insertResult = await db.UserCollection.insertOne(data);
    if (insertResult) {
      return insertResult;
    }
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern.id) {
      console.log("Duplicate unique value detected. Skipping insertion.");
    } else {
      // Handle other types of errors
      console.error("Error inserting document:", error.message);
    }
  }
}

export async function set_bot(
  data: number, // user_id
  token: string, // bot_token
  botusername: string // bot_username
): Promise<any | null> {
  try {
    const user_data = { user_id: data}; // Find document based on user_id

    // Set the bot_username as a key under the "bots" object
    const updateDoc = {
      $set: {
        [`bots.${botusername}.bot_token`]: token,
      },
    };

    // Upsert: update if the user exists, or insert if new
    const file_result = await db.UserCollection.updateOne(
      user_data,
      updateDoc,
      { upsert: true } // Create the document if it doesn't exist
    );

    // Return appropriate response based on modified or inserted document
    if (file_result.modifiedCount === 0 && file_result.upsertedCount === 0) {
      return null; // No document modified or inserted
    }

    return file_result.modifiedCount || file_result.upsertedCount; // Return count of modified or inserted docs
  } catch (error: any) {
    // Handle specific errors
    if (error.code === 11000 && error.keyPattern?.user_id) {
      console.log("Duplicate value detected. Skipping update.");
    } else {
      console.error("Error updating document:", error.message);
    }

    return null; // Return null in case of an error
  }
}

// Function to check if bot_username exists
export async function check_bot_username_exists(
  data: number, // user_id
  bot_username: string // bot_username to check
): Promise<boolean> {
  try {
    const user_id = { user_id: data };

    // Check if the bot_username exists inside the 'bots' object
    const user = await db.UserCollection.findOne(user_id, {
      projection: { [`bots.${bot_username}`]: 1 }, // Search within 'bots' object
    });

    // Return true if the bot_username exists inside the 'bots' object, otherwise false
    return user && user.bots && user.bots[bot_username] ? true : false;
  } catch (error: any) {
    console.error("Error checking bot username:", error.message);
    return false; // Return false if there is an error
  }
}

export async function set_db_url(
  data: number, // user_id
  db_url: string, // new db_url
  bot_username: string // bot_username to update
): Promise<number | null> {
  try {
    const hasbot = await check_bot_username_exists(data, bot_username);
    if (!hasbot) {
      return null;
    }
    // Construct the filter to find the specific bot with null db_url
    const filter = {
      user_id: data,
      [`bots.${bot_username}.db_url`]: null,
    };

    // Construct the update document
    const updateDoc = {
      $set: {
        [`bots.${bot_username}.db_url`]: db_url,
      },
    };

    // Perform the update operation
    const result = await db.UserCollection.updateOne(filter, updateDoc);
    const modifiedCount = result.modifiedCount;

    return modifiedCount; // Return the count of modified documents
  } catch (error: any) {
    console.error("Error updating document:", error.message);
    return null; // Return null in case of an error
  }
}

export async function set_f_sub(
  data: number, // user_id
  f_sub: number, // new f_sub
  f_sub_link: string,
  bot_username: string // bot_username to update
): Promise<number | null> {
  try {
    const hasbot = await check_bot_username_exists(data, bot_username);
    if (!hasbot) {
      return null;
    }
    // Construct the filter to find the specific bot
    const filter = {
      user_id: data,
    };

    // Construct the update document
    const updateDoc = {
      $set: {
        [`bots.${bot_username}.f_sub`]: f_sub,
        [`bots.${bot_username}.f_sub_link`]: f_sub_link,
      },
    };
    // Perform the update operation
    const result = await db.UserCollection.updateOne(filter, updateDoc);
    const modifiedCount = result.modifiedCount;

    return modifiedCount; // Return the count of modified documents
  } catch (error: any) {
    console.error("Error updating document:", error.message);
    return null; // Return null in case of an error
  }
}

export async function set_db_channel(
  data: number, // user_id
  db_channel: number,
  bot_username: string // bot_username to update
): Promise<number | null> {
  try {
    const hasbot = await check_bot_username_exists(data, bot_username);
    if (!hasbot) {
      return null;
    }
    // Construct the filter to find the specific bot
    const filter = {
      user_id: data,
    };

    // Construct the update document
    const updateDoc = {
      $set: {
        [`bots.${bot_username}.db_channel`]: db_channel,
      },
    };
    // Perform the update operation
    const result = await db.UserCollection.updateOne(filter, updateDoc);
    const modifiedCount = result.modifiedCount;

    return modifiedCount; // Return the count of modified documents
  } catch (error: any) {
    console.error("Error updating document:", error.message);
    return null; // Return null in case of an error
  }
}

export async function remove_f_sub(
  data: number, // user_id
  bot_username: string // bot_username to update
): Promise<number | null> {
  try {
    const hasbot = await check_bot_username_exists(data, bot_username);
    if (!hasbot) {
      return null;
    }
    // Construct the filter to find the specific bot
    const filter = {
      user_id: data,
    };

    // Construct the update document to remove the f_sub and f_sub_link fields
    const updateDoc = {
      $unset: {
        [`bots.${bot_username}.f_sub`]: "",
        [`bots.${bot_username}.f_sub_link`]: "",
      },
    };

    // Perform the update operation
    const result = await db.UserCollection.updateOne(filter, updateDoc);
    const modifiedCount = result.modifiedCount;

    return modifiedCount; // Return the count of modified documents
  } catch (error: any) {
    console.error("Error updating document:", error.message);
    return null; // Return null in case of an error
  }
}

export async function remove_db_channel(
  data: number, // user_id
  bot_username: string // bot_username to update
): Promise<number | null> {
  try {
    const hasbot = await check_bot_username_exists(data, bot_username);
    if (!hasbot) {
      return null;
    }
    // Construct the filter to find the specific bot
    const filter = {
      user_id: data,
    };

    // Construct the update document to remove the f_sub and f_sub_link fields
    const updateDoc = {
      $unset: {
        [`bots.${bot_username}.db_channel`]: "",
      },
    };

    // Perform the update operation
    const result = await db.UserCollection.updateOne(filter, updateDoc);
    const modifiedCount = result.modifiedCount;

    return modifiedCount; // Return the count of modified documents
  } catch (error: any) {
    console.error("Error updating document:", error.message);
    return null; // Return null in case of an error
  }
}

export async function delete_bot_token(
  data: number,
  bot_username: string
): Promise<any | null> {
  try {
    const hasbot = await check_bot_username_exists(data, bot_username);
    if (!hasbot) {
      return null;
    }
    const user_id = { user_id: data };

    // Unset the entire bot object for the specified bot_username
    const updateDoc = {
      $unset: {
        [`bots.${bot_username}`]: "", // Unset the entire object for the specified bot_username
      },
    };

    const file_result = await db.UserCollection.updateOne(user_id, updateDoc);
    const res = file_result.modifiedCount;

    return { res }; // Return the count of modified documents
  } catch (error: any) {
    // Handle potential errors
    console.error("Error deleting bot token:", error.message);
    return null; // Return null in case of an error
  }
}

export async function get_bot_token(
  data: number,
  bot_username: string
): Promise<string | null> {
  try {
    const hasbot = await check_bot_username_exists(data, bot_username);
    if (!hasbot) {
      return null;
    }
    const user_id = { user_id: data };

    // Query the document to get the bot_token for a specific bot_username
    const result = await db.UserCollection.findOne(user_id, {
      projection: { [`bots.${bot_username}.bot_token`]: 1, _id: 0 },
    });

    // Extract the bot_token from the result
    const bot_token = result?.bots?.[bot_username]?.bot_token ?? null;

    return bot_token; // Return the bot_token or null if not found
  } catch (error: any) {
    console.error("Error retrieving bot token:", error.message);
    return null; // Return null in case of an error
  }
}

export async function get_db_url_with_id_and_botusername(
  data: number,
  botUsername: string
): Promise<string | null> {
  try {
    const hasbot = await check_bot_username_exists(data, botUsername);
    if (!hasbot) {
      return null;
    }
    const result = await db.UserCollection.findOne(
      { user_id: data },
      { projection: { [`bots.${botUsername}.db_url`]: 1, _id: 0 } } // Use botUsername in projection
    );

    // Access the db_url from the nested structure
    const db_url = result?.bots?.[botUsername]?.db_url ?? null;

    return db_url; // Return the db_url
  } catch (error: any) {
    console.log(error.message);
    return null; // Return null in case of an error
  }
}

export async function get_db_url_and_fsub_with_botusername(
  botUsername: string
): Promise<{
  user_id: number | null;
  db_url: string | null;
  f_sub: number | null;
  f_sub_link: string | null;
  db_channel: number | null;
}> {
  try {
    // Find the user document that contains the specified bot
    const result = await db.UserCollection.findOne(
      { [`bots.${botUsername}`]: { $exists: true } }, // Ensure that the bot exists
      {
        projection: {
          user_id: 1, // Include user_id in the projection
          [`bots.${botUsername}.db_url`]: 1, // Correctly project the db_url
          [`bots.${botUsername}.f_sub`]: 1, // Correctly project f_sub
          [`bots.${botUsername}.f_sub_link`]: 1, // Correctly project f_sub_link
          [`bots.${botUsername}.db_channel`]: 1, // Correctly project db_channel
          _id: 0, // Exclude _id if not needed
        },
      }
    );
    // Access the specific bot's data and user_id
    const user_id = result?.user_id ?? null;
    const db_url = result?.bots?.[botUsername]?.db_url ?? null;
    const f_sub = result?.bots?.[botUsername]?.f_sub ?? null;
    const f_sub_link = result?.bots?.[botUsername]?.f_sub_link ?? null;
    const db_channel = result?.bots?.[botUsername]?.db_channel ?? null;

    return { user_id, db_url, f_sub, f_sub_link, db_channel };
  } catch (error: any) {
    console.log(error.message);
    return {
      user_id: null,
      db_url: null,
      f_sub: null,
      f_sub_link: null,
      db_channel: null,
    }; // Return nulls in case of an error
  }
}

export async function count_user_bots(userId: number): Promise<number> {
  try {
    const result = await db.UserCollection.findOne(
      { user_id: userId },
      { projection: { bots: 1, _id: 0 } } // Project only the bots field
    );

    // Check if result exists and has bots
    if (result && result.bots) {
      return Object.keys(result.bots).length; // Count the number of keys in the bots object
    } else {
      return 0; // No bots found for the user
    }
  } catch (error: any) {
    console.log("Error counting user bots:", error.message);
    throw new Error("Unable to count user bots due to an internal error."); // Throw an error for better security
  }
}

export async function get_bot_usernames(
  user_id: number
): Promise<string[] | null> {
  try {
    // Find the user document with the specified user_id
    const result = await db.UserCollection.findOne(
      { user_id: user_id }, // Query to find the user by user_id
      { projection: { bots: 1, _id: 0 } } // Only project the 'bots' field
    );

    // Check if the user has bots
    if (result && result.bots) {
      const botUsernames = Object.keys(result.bots); // Get the bot usernames as keys of the 'bots' object
      return botUsernames.length > 0 ? botUsernames : null; // Return bot usernames or null if none found
    } else {
      return null; // Return null if no bots exist for the user
    }
  } catch (error: any) {
    console.error("Error fetching bot usernames:", error.message);
    return null; // Return null in case of an error
  }
}

//////////////////////////////////////////////////////////////////////////

export async function insert_user_on_slave(data: object, botusername: string) {
  try {
    const user_db = await get_cache_db(botusername);
    if (user_db) {
      const insertResult = await user_db.UserCollection.insertOne(data);
      if (insertResult) {
        return insertResult;
      }
    }
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern.id) {
      console.log("Duplicate unique value detected. Skipping insertion.");
    } else {
      // Handle other types of errors
      console.error("Error inserting document:", error.message);
    }
  }
}

export async function insert_file(data: any, botusername: string) {
  try {
    const user_db = await get_cache_db(botusername);
    if (user_db) {
      const insertResult = await user_db.FilesCollection.insertOne(data);
      if (insertResult) {
        return insertResult;
      }
    }
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern.file_unique_id) {
      console.log("Duplicate unique value detected. Skipping insertion.");
    } else {
      // Handle other types of errors
      console.error("Error inserting document:", error.message);
    }
  }
}

export async function get_cache_db(
  botUsername: string
): Promise<UserDB | null> {
  const user_db = botDataPool.get(botUsername)?.user_db;
  if (
    user_db?.mongoclient &&
    user_db?.FilesCollection &&
    user_db?.UserCollection
  ) {
    return user_db;
  } else {
    console.log("No valid connection found");
    return null;
  }
}

export async function get_cache_fsub(
  username: string
): Promise<number | null | undefined> {
  return botDataPool.get(username)?.f_sub;
}

export async function get_cache_db_channel(
  username: string
): Promise<number | null | undefined> {
  return botDataPool.get(username)?.db_channel;
}

export async function get_cache_user_id(
  username: string
): Promise<number | null | undefined> {
  return botDataPool.get(username)?.user_id;
}

export async function get_cache_fsub_link(
  username: string
): Promise<string | null | undefined> {
  return botDataPool.get(username)?.f_sub_link;
}

// Function to update specific fields in botData for a given username
export function updateBotData(
  username: string,
  user_id: number,
  newData: Partial<botData>
): boolean {
  // Check if existing data for the username exists
  const existingData = botDataPool.get(username);

  if (existingData) {
    // Merge the existing data with the new data (without overwriting other fields)
    const updatedData: botData = {
      ...existingData,
      ...newData, // This only updates the fields provided in newData
    };

    // Update the map with the new merged data
    botDataPool.set(username, updatedData);
    return true; // Indicating successful update
  } else {
    // Create new botData entry if no existing data found
    const newBotData: botData = {
      user_db: newData.user_db ?? null,
      user_id: user_id, // // Assuming user_id must be provided
      f_sub: newData.f_sub ?? null,
      db_channel: newData.db_channel ?? null,
      f_sub_link: newData.f_sub_link ?? null,
    };

    // Add new entry to the map
    botDataPool.set(username, newBotData);
    return true; // Indicating successful creation
  }
}

export async function checkUserMembership(
  ctx: Context,
  chatId: number,
  userId: number
) {
  try {
    const member = await ctx.api.getChatMember(chatId, userId);

    // Check the status of the member
    if (
      member.status === "member" ||
      member.status === "administrator" ||
      member.status === "creator"
    ) {
      return true; // User is a member or an admin
    } else {
      return false; // User is not a member
    }
  } catch (error: any) {
    console.error("Error checking membership:", error.message);
    // Handle specific error cases if needed, e.g., user not found or chat not found
    return false; // Returning false in case of any error
  }
}

export async function search_document(
  searchTerms: string,
  page: number,
  botusername: string
): Promise<{ filteredDocs: any[]; totalsize: number }> {
  try {
    const user_db = await get_cache_db(botusername);
    if (!user_db) {
      throw new Error("Database not found for the given bot username");
    }
    const skip = (page - 1) * 10;
    // Split the search terms into individual words

    // Join the formatted terms array back into a string with space as separator
    const term = `${searchTerms
      .split(" ")
      .map((term) => `\"${term}\"`)
      .join(" ")}`;

    // Count filtered documents
    const totalsize = await user_db.FilesCollection.countDocuments({
      $text: { $search: term },
    });
    // Fetch filtered documents for the specified page
    const filteredDocs = await user_db.FilesCollection.find({
      $text: { $search: term },
    })
      .project({
        file_name: 1,
        file_unique_id: 1,
        file_size: 1,
        _id: 0, // Optionally, exclude the default _id field if not needed
      })
      .skip(skip)
      .limit(10)
      .toArray();

    // Return an object containing both filtered documents and total size
    return { filteredDocs, totalsize };
  } catch (error: any) {
    console.error("Error in search_document at dbFunc.ts", error.message);
    throw error;
  }
}

export async function search_file_id(
  data: string,
  botusername: string
): Promise<any | null> {
  try {
    const user_db = await get_cache_db(botusername);
    if (!user_db) {
      throw new Error("Database not found for the given bot username");
    }
    const filteredDocs = await user_db.FilesCollection.findOne(
      { file_unique_id: data },
      { projection: { file_id: 1, file_name: 1, _id: 0 } }
    );
    return { filteredDocs };
  } catch (error: any) {
    console.log(error.message);
  }
}
