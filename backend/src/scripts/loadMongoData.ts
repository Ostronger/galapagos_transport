import "dotenv/config";
import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/galapagos";

async function loadData() {
  const client = new MongoClient(uri);

  try {
    console.log("📡 Connexion à MongoDB...");
    await client.connect();
    const db = client.db();
    console.log("✅ Connecté à MongoDB");

    // Charger les datasets
    const datasetsPath = join(__dirname, "../../../datasets/mongo");

    const collections = [
      "clients",
      // "produits",
      "lockers",
      // "caisses",
      // "commandes",
      "hydravions",
      // "livraisons",
    ];

    for (const collectionName of collections) {
      console.log(`\n📦 Chargement de ${collectionName}...`);
      const filePath = join(datasetsPath, `${collectionName}.json`);

      try {
        const data = JSON.parse(readFileSync(filePath, "utf-8"));

        // Supprimer les données existantes
        await db.collection(collectionName).deleteMany({});
        console.log(`  ↳ Collection ${collectionName} vidée`);

        // Insérer les nouvelles données
        if (data.length > 0) {
          await db.collection(collectionName).insertMany(data);
          console.log(`  ✅ ${data.length} documents insérés dans ${collectionName}`);
        } else {
          console.log(`  ⚠️ Aucune donnée dans ${collectionName}`);
        }
      } catch (err: any) {
        console.error(`  ❌ Erreur pour ${collectionName}:`, err.message);
      }
    }

    // Charger l'entrepôt (fichier unique, pas un tableau)
    // console.log(`\n🏭 Chargement de l'entrepôt...`);
    // const entrepotFilePath = join(datasetsPath, "entrepot.json");
    // try {
    //   const entrepotData = JSON.parse(readFileSync(entrepotFilePath, "utf-8"));
    //   await db.collection("entrepot").deleteMany({});
    //   console.log(`  ↳ Collection entrepot vidée`);
    //   await db.collection("entrepot").insertOne(entrepotData);
    //   console.log(`  ✅ Entrepôt principal inséré`);
    // } catch (err: any) {
    //   console.error(`  ❌ Erreur pour l'entrepôt:`, err.message);
    // }

    console.log("\n🎉 Chargement des données terminé !");
  } catch (err) {
    console.error("❌ Erreur:", err);
  } finally {
    await client.close();
    console.log("🔌 Connexion fermée");
  }
}

loadData();
