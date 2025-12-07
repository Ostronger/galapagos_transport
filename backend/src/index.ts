import "dotenv/config"; // Charger les variables d'environnement dès le départ
import { ApolloServer } from "@apollo/server"; // Apollo Server principal
import { startStandaloneServer } from "@apollo/server/standalone"; // Pour démarrer le serveur

import neo4j, { Driver } from "neo4j-driver"; //
import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./schema/resolvers.js";
import { connectMongo } from "./config/mongo.js";
import { ClientRepository } from "./datasources/mongo/clientRepository.js";
import { getNeo4jDriver } from "./config/neo4j.js";
import { PortRepository } from "./datasources/mongo/portRepository.js";
import { PortNeo4jRepository } from "./datasources/neo4j/portRepository.js";
import { TrajetRepository } from "./datasources/neo4j/trajetRepository.js";
import { HydravionRepository } from "./datasources/mongo/hydravionRepository.js";
import { HydravionNeo4jRepository } from "./datasources/neo4j/hydravionRepository.js";
import { LockerRepository } from "./datasources/mongo/lockerRepository.js";
import { CommandeRepository } from "./datasources/mongo/commandeRepository.js";
import { ProduitRepository } from "./datasources/mongo/produitRepository.js";
import { LivraisonRepository } from "./datasources/mongo/livraisonRepository.js";

async function startServer() {
  console.log("Démarrage du serveur GraphQL...");

  try {
    console.log("➡️ Connexion à MongoDB...");
    const mongoDb = await connectMongo(); // Connexion à MongoDB
    console.log("✅ MongoDB connecté avec succès");

    // Initialisation des repositories
    const neo4jDriver = getNeo4jDriver();
    const clientRepository = new ClientRepository(mongoDb);
    const portRepository = new PortRepository(mongoDb);
    const portNeo4jRepository = new PortNeo4jRepository(neo4jDriver);
    const trajetRepository = new TrajetRepository(neo4jDriver);
    const hydravionRepository = new HydravionRepository(mongoDb);
    const hydravionNeo4jRepository = new HydravionNeo4jRepository(neo4jDriver);
    const lockerRepository = new LockerRepository(mongoDb);
    const commandeRepository = new CommandeRepository(mongoDb);
    const produitRepository = new ProduitRepository(mongoDb);
    const livraisonRepository = new LivraisonRepository(mongoDb);

    const server = new ApolloServer({
      // Création de l'instance Apollo Server
      typeDefs,
      resolvers,
    });

    console.log("➡️ Démarrage d'Apollo Server...");
    const { url } = await startStandaloneServer(server, {
      // Démarrage du serveur
      listen: { port: 4000 },
      context: async () => ({
        // permet de passer les repositories dans le contexte pour quil soit accessible dans les resolvers
        clientRepository,
        portRepository,
        portNeo4jRepository,
        trajetRepository,
        hydravionRepository,
        hydravionNeo4jRepository,
        lockerRepository,
        commandeRepository,
        produitRepository,
        livraisonRepository,
      }),
    });

    console.log(`✅ Apollo Server démarré`);
    console.log(`🌍 Serveur GraphQL prêt sur ${url}`);

    await calculateAllDistances(neo4jDriver);
  } catch (err) {
    console.error("❌ Erreur au démarrage du serveur :", err);
  }
}

/**
 * Calcule la distance en kilomètres entre deux points géographiques
 * en utilisant la formule de Haversine
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Arrondir à 2 décimales
}

/**
 * Récupère tous les ports et calcule les distances entre eux
 */
export async function calculateAllDistances(neo4jDriver: any): Promise<any[]> {
  const session = neo4jDriver.session();

  try {
    // Récupérer tous les ports avec leurs coordonnées
    const result = await session.run(`
      MATCH (p:Port)
      RETURN p.id, p.nom, p.latitude, p.longitude
      ORDER BY p.id
    `);

    const ports = result.records.map((record: any) => ({
      id: record.get("p.id"),
      nom: record.get("p.nom"),
      latitude: record.get("p.latitude"),
      longitude: record.get("p.longitude"),
    }));

    console.log("🌍 Ports trouvés :\n");
    ports.forEach((port: any) => {
      console.log(
        `  ${port.id} - ${port.nom} (${port.latitude}, ${port.longitude})`
      );
    });

    console.log("\n📏 Distances calculées :\n");

    // Calculer les distances pour toutes les paires de ports
    const distances: any[] = [];

    for (let i = 0; i < ports.length; i++) {
      for (let j = i + 1; j < ports.length; j++) {
        const port1 = ports[i];
        const port2 = ports[j];

        const distance = haversineDistance(
          port1.latitude,
          port1.longitude,
          port2.latitude,
          port2.longitude
        );

        distances.push({
          from: port1.id,
          fromNom: port1.nom,
          to: port2.id,
          toNom: port2.nom,
          distance,
        });

        console.log(
          `  ${port1.id} (${port1.nom}) <-> ${port2.id} (${port2.nom}) : ${distance} km`
        );
      }
    }

    console.log("\n✅ Calcul terminé !");
    console.log(`Total de trajets : ${distances.length}`);

    return distances;
  } catch (error) {
    console.error("❌ Erreur lors du calcul des distances :", error);
    return [];
  } finally {
    await session.close();
  }
}

startServer(); // Lancer le serveur
