import { mongoconnect } from "../db/dbConfig.js";
import { botDataPool } from "../server.js";
export const db = await mongoconnect();
if (db) {
    console.log("Connected successfully to DB server");
}
export async function insert_user(data) {
    try {
        const insertResult = await db.UserCollection.insertOne(data);
        if (insertResult) {
            return insertResult;
        }
    }
    catch (error) {
        if (error.code === 11000 && error.keyPattern.id) {
            console.log("Duplicate unique value detected. Skipping insertion.");
        }
        else {
            // Handle other types of errors
            console.error("Error inserting document:", error.message);
        }
    }
}
export async function set_bot(data, // user_id
token, // bot_token
botusername // bot_username
) {
    var _a;
    try {
        const user_data = { user_id: data }; // Find document based on user_id
        // Set the bot_username as a key under the "bots" object
        const updateDoc = {
            $set: {
                [`bots.${botusername}.bot_token`]: token,
            },
        };
        // Upsert: update if the user exists, or insert if new
        const file_result = await db.UserCollection.updateOne(user_data, updateDoc, { upsert: true } // Create the document if it doesn't exist
        );
        // Return appropriate response based on modified or inserted document
        if (file_result.modifiedCount === 0 && file_result.upsertedCount === 0) {
            return null; // No document modified or inserted
        }
        return file_result.modifiedCount || file_result.upsertedCount; // Return count of modified or inserted docs
    }
    catch (error) {
        // Handle specific errors
        if (error.code === 11000 && ((_a = error.keyPattern) === null || _a === void 0 ? void 0 : _a.user_id)) {
            console.log("Duplicate value detected. Skipping update.");
        }
        else {
            console.error("Error updating document:", error.message);
        }
        return null; // Return null in case of an error
    }
}
// Function to check if bot_username exists
export async function check_bot_username_exists(data, // user_id
bot_username // bot_username to check
) {
    try {
        const user_id = { user_id: data };
        // Check if the bot_username exists inside the 'bots' object
        const user = await db.UserCollection.findOne(user_id, {
            projection: { [`bots.${bot_username}`]: 1 }, // Search within 'bots' object
        });
        // Return true if the bot_username exists inside the 'bots' object, otherwise false
        return user && user.bots && user.bots[bot_username] ? true : false;
    }
    catch (error) {
        console.error("Error checking bot username:", error.message);
        return false; // Return false if there is an error
    }
}
export async function set_db_url(data, // user_id
db_url, // new db_url
bot_username // bot_username to update
) {
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
    }
    catch (error) {
        console.error("Error updating document:", error.message);
        return null; // Return null in case of an error
    }
}
export async function set_f_sub(data, // user_id
f_sub, // new f_sub
f_sub_link, bot_username // bot_username to update
) {
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
    }
    catch (error) {
        console.error("Error updating document:", error.message);
        return null; // Return null in case of an error
    }
}
export async function set_db_channel(data, // user_id
db_channel, bot_username // bot_username to update
) {
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
    }
    catch (error) {
        console.error("Error updating document:", error.message);
        return null; // Return null in case of an error
    }
}
export async function remove_f_sub(data, // user_id
bot_username // bot_username to update
) {
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
    }
    catch (error) {
        console.error("Error updating document:", error.message);
        return null; // Return null in case of an error
    }
}
export async function remove_db_channel(data, // user_id
bot_username // bot_username to update
) {
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
    }
    catch (error) {
        console.error("Error updating document:", error.message);
        return null; // Return null in case of an error
    }
}
export async function delete_bot_token(data, bot_username) {
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
    }
    catch (error) {
        // Handle potential errors
        console.error("Error deleting bot token:", error.message);
        return null; // Return null in case of an error
    }
}
export async function get_bot_token(data, bot_username) {
    var _a, _b, _c;
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
        const bot_token = (_c = (_b = (_a = result === null || result === void 0 ? void 0 : result.bots) === null || _a === void 0 ? void 0 : _a[bot_username]) === null || _b === void 0 ? void 0 : _b.bot_token) !== null && _c !== void 0 ? _c : null;
        return bot_token; // Return the bot_token or null if not found
    }
    catch (error) {
        console.error("Error retrieving bot token:", error.message);
        return null; // Return null in case of an error
    }
}
export async function get_db_url_with_id_and_botusername(data, botUsername) {
    var _a, _b, _c;
    try {
        const hasbot = await check_bot_username_exists(data, botUsername);
        if (!hasbot) {
            return null;
        }
        const result = await db.UserCollection.findOne({ user_id: data }, { projection: { [`bots.${botUsername}.db_url`]: 1, _id: 0 } } // Use botUsername in projection
        );
        // Access the db_url from the nested structure
        const db_url = (_c = (_b = (_a = result === null || result === void 0 ? void 0 : result.bots) === null || _a === void 0 ? void 0 : _a[botUsername]) === null || _b === void 0 ? void 0 : _b.db_url) !== null && _c !== void 0 ? _c : null;
        return db_url; // Return the db_url
    }
    catch (error) {
        console.log(error.message);
        return null; // Return null in case of an error
    }
}
export async function get_db_url_and_fsub_with_botusername(botUsername) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    try {
        // Find the user document that contains the specified bot
        const result = await db.UserCollection.findOne({ [`bots.${botUsername}`]: { $exists: true } }, // Ensure that the bot exists
        {
            projection: {
                user_id: 1, // Include user_id in the projection
                [`bots.${botUsername}.db_url`]: 1, // Correctly project the db_url
                [`bots.${botUsername}.f_sub`]: 1, // Correctly project f_sub
                [`bots.${botUsername}.f_sub_link`]: 1, // Correctly project f_sub_link
                [`bots.${botUsername}.db_channel`]: 1, // Correctly project db_channel
                _id: 0, // Exclude _id if not needed
            },
        });
        // Access the specific bot's data and user_id
        const user_id = (_a = result === null || result === void 0 ? void 0 : result.user_id) !== null && _a !== void 0 ? _a : null;
        const db_url = (_d = (_c = (_b = result === null || result === void 0 ? void 0 : result.bots) === null || _b === void 0 ? void 0 : _b[botUsername]) === null || _c === void 0 ? void 0 : _c.db_url) !== null && _d !== void 0 ? _d : null;
        const f_sub = (_g = (_f = (_e = result === null || result === void 0 ? void 0 : result.bots) === null || _e === void 0 ? void 0 : _e[botUsername]) === null || _f === void 0 ? void 0 : _f.f_sub) !== null && _g !== void 0 ? _g : null;
        const f_sub_link = (_k = (_j = (_h = result === null || result === void 0 ? void 0 : result.bots) === null || _h === void 0 ? void 0 : _h[botUsername]) === null || _j === void 0 ? void 0 : _j.f_sub_link) !== null && _k !== void 0 ? _k : null;
        const db_channel = (_o = (_m = (_l = result === null || result === void 0 ? void 0 : result.bots) === null || _l === void 0 ? void 0 : _l[botUsername]) === null || _m === void 0 ? void 0 : _m.db_channel) !== null && _o !== void 0 ? _o : null;
        return { user_id, db_url, f_sub, f_sub_link, db_channel };
    }
    catch (error) {
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
export async function count_user_bots(userId) {
    try {
        const result = await db.UserCollection.findOne({ user_id: userId }, { projection: { bots: 1, _id: 0 } } // Project only the bots field
        );
        // Check if result exists and has bots
        if (result && result.bots) {
            return Object.keys(result.bots).length; // Count the number of keys in the bots object
        }
        else {
            return 0; // No bots found for the user
        }
    }
    catch (error) {
        console.log("Error counting user bots:", error.message);
        throw new Error("Unable to count user bots due to an internal error."); // Throw an error for better security
    }
}
export async function get_bot_usernames(user_id) {
    try {
        // Find the user document with the specified user_id
        const result = await db.UserCollection.findOne({ user_id: user_id }, // Query to find the user by user_id
        { projection: { bots: 1, _id: 0 } } // Only project the 'bots' field
        );
        // Check if the user has bots
        if (result && result.bots) {
            const botUsernames = Object.keys(result.bots); // Get the bot usernames as keys of the 'bots' object
            return botUsernames.length > 0 ? botUsernames : null; // Return bot usernames or null if none found
        }
        else {
            return null; // Return null if no bots exist for the user
        }
    }
    catch (error) {
        console.error("Error fetching bot usernames:", error.message);
        return null; // Return null in case of an error
    }
}
//////////////////////////////////////////////////////////////////////////
export async function insert_user_on_slave(data, botusername) {
    try {
        const user_db = await get_cache_db(botusername);
        if (user_db) {
            const insertResult = await user_db.UserCollection.insertOne(data);
            if (insertResult) {
                return insertResult;
            }
        }
    }
    catch (error) {
        if (error.code === 11000 && error.keyPattern.id) {
            console.log("Duplicate unique value detected. Skipping insertion.");
        }
        else {
            // Handle other types of errors
            console.error("Error inserting document:", error.message);
        }
    }
}
export async function insert_file(data, botusername) {
    try {
        const user_db = await get_cache_db(botusername);
        if (user_db) {
            const insertResult = await user_db.FilesCollection.insertOne(data);
            if (insertResult) {
                return insertResult;
            }
        }
    }
    catch (error) {
        if (error.code === 11000 && error.keyPattern.file_unique_id) {
            console.log("Duplicate unique value detected. Skipping insertion.");
        }
        else {
            // Handle other types of errors
            console.error("Error inserting document:", error.message);
        }
    }
}
export async function get_cache_db(botUsername) {
    var _a;
    const user_db = (_a = botDataPool.get(botUsername)) === null || _a === void 0 ? void 0 : _a.user_db;
    if ((user_db === null || user_db === void 0 ? void 0 : user_db.mongoclient) &&
        (user_db === null || user_db === void 0 ? void 0 : user_db.FilesCollection) &&
        (user_db === null || user_db === void 0 ? void 0 : user_db.UserCollection)) {
        return user_db;
    }
    else {
        console.log("No valid connection found");
        return null;
    }
}
export async function get_cache_fsub(username) {
    var _a;
    return (_a = botDataPool.get(username)) === null || _a === void 0 ? void 0 : _a.f_sub;
}
export async function get_cache_db_channel(username) {
    var _a;
    return (_a = botDataPool.get(username)) === null || _a === void 0 ? void 0 : _a.db_channel;
}
export async function get_cache_user_id(username) {
    var _a;
    return (_a = botDataPool.get(username)) === null || _a === void 0 ? void 0 : _a.user_id;
}
export async function get_cache_fsub_link(username) {
    var _a;
    return (_a = botDataPool.get(username)) === null || _a === void 0 ? void 0 : _a.f_sub_link;
}
// Function to update specific fields in botData for a given username
export function updateBotData(username, user_id, newData) {
    var _a, _b, _c, _d;
    // Check if existing data for the username exists
    const existingData = botDataPool.get(username);
    if (existingData) {
        // Merge the existing data with the new data (without overwriting other fields)
        const updatedData = Object.assign(Object.assign({}, existingData), newData);
        // Update the map with the new merged data
        botDataPool.set(username, updatedData);
        return true; // Indicating successful update
    }
    else {
        // Create new botData entry if no existing data found
        const newBotData = {
            user_db: (_a = newData.user_db) !== null && _a !== void 0 ? _a : null,
            user_id: user_id, // // Assuming user_id must be provided
            f_sub: (_b = newData.f_sub) !== null && _b !== void 0 ? _b : null,
            db_channel: (_c = newData.db_channel) !== null && _c !== void 0 ? _c : null,
            f_sub_link: (_d = newData.f_sub_link) !== null && _d !== void 0 ? _d : null,
        };
        // Add new entry to the map
        botDataPool.set(username, newBotData);
        return true; // Indicating successful creation
    }
}
export async function checkUserMembership(ctx, chatId, userId) {
    try {
        const member = await ctx.api.getChatMember(chatId, userId);
        // Check the status of the member
        if (member.status === "member" ||
            member.status === "administrator" ||
            member.status === "creator") {
            return true; // User is a member or an admin
        }
        else {
            return false; // User is not a member
        }
    }
    catch (error) {
        console.error("Error checking membership:", error.message);
        // Handle specific error cases if needed, e.g., user not found or chat not found
        return false; // Returning false in case of any error
    }
}
export async function search_document(searchTerms, page, botusername) {
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
    }
    catch (error) {
        console.error("Error in search_document at dbFunc.ts", error.message);
        throw error;
    }
}
export async function search_file_id(data, botusername) {
    try {
        const user_db = await get_cache_db(botusername);
        if (!user_db) {
            throw new Error("Database not found for the given bot username");
        }
        const filteredDocs = await user_db.FilesCollection.findOne({ file_unique_id: data }, { projection: { file_id: 1, file_name: 1, _id: 0 } });
        return { filteredDocs };
    }
    catch (error) {
        console.log(error.message);
    }
}
