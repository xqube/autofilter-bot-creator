import { Collection, Db, MongoClient } from "mongodb";

export type Username = string;

export type UserDB = {
  mongoclient: MongoClient;
  FilesCollection: Collection;
  UserCollection: Collection;
  database: Db;
};

//type for map
export type botData = {
  user_db: UserDB | null; // You can use Record<string, any> for a general object or define a more specific shape
  user_id: number
  f_sub?: number | null;
  db_channel?: number | null;
  f_sub_link?: string | null;
};


// Define a type for botInfo for db botinfo
type BotData = {
  bot_token: string; // Required field for the bot token
  db_url?: string; // Optional field for the database URL
  f_sub?: string;
  f_sub_link?: string;
};
export type BotsList = Record<string, BotData>;