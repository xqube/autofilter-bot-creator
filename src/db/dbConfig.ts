import { MongoClient } from "mongodb";
import "dotenv/config";

export const mongoclient = new MongoClient(process.env.MONGODB_URL!);

export async function mongoconnect(): Promise<any> {
  // Use connect method to connect to the server
  try {
    await mongoclient.connect();
    const database = mongoclient.db("tgfilterbot");
    const UserCollection = database.collection("users");

    //Indexing is DB admins only command don't use it with applications, just written here for reference

    await UserCollection.createIndex({ user_id: 1 }, { unique: true });

    return { mongoclient, UserCollection, database };
  } catch (error: any) {
    console.log("Error on db config", error.message);
    return null;
  }
}

export async function usermongoconnect(db_url: string): Promise<any> {
  // Use connect method to connect to the server
  try {
    const mongoclient = new MongoClient(db_url);
    await mongoclient.connect();
    const database = mongoclient.db("tgfilterbot");
    const FilesCollection = database.collection("files");
    const UserCollection = database.collection("users");
    //Indexing is DB admins only command don't use it with applications, just written here for reference
    await FilesCollection.createIndex({ file_unique_id: 1 }, { unique: true });
    await FilesCollection.createIndex({ file_name: "text" });
    await UserCollection.createIndex({ user_id: 1 }, { unique: true });
    return { mongoclient, FilesCollection, UserCollection, database };
  } catch (error: any) {
    console.log("Error on db config", error.message);
    return null;
  }
}
