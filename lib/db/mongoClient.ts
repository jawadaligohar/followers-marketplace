import { MongoClient } from "mongodb";

declare global {
  var _nativeMongoClient: MongoClient | undefined;
}
// The adapter connects when it performs an operation, rather than during a build/import.
export default function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  return global._nativeMongoClient ??= new MongoClient(uri);
}
