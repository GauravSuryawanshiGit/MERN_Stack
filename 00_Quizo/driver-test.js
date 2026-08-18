const { MongoClient } = require("mongodb");

const uri =
  "mongodb://quizoadmin:Quizo2026Pass123@ac-wmjnh19-shard-00-00.gzvfdzz.mongodb.net:27017,ac-wmjnh19-shard-00-01.gzvfdzz.mongodb.net:27017,ac-wmjnh19-shard-00-02.gzvfdzz.mongodb.net:27017/quizo?ssl=true&replicaSet=atlas-ju1cy3-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Quizo";

async function run() {
  try {
    console.log("Testing Atlas Connection...");

    const client = new MongoClient(uri);

    await client.connect();

    console.log("✅ DRIVER CONNECTED SUCCESSFULLY");

    await client.close();
  } catch (err) {
    console.error(err);
  }
}

run();