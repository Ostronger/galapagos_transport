import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/galapagos";

let dbInstance: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (!dbInstance) {
    const client = new MongoClient(uri);
    await client.connect();
    dbInstance = client.db(); // nom de la base pris dans l'URI (galapagos)
  }
  return dbInstance;
}