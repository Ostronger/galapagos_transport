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

    const server = new ApolloServer({ // Création de l'instance Apollo Server
      typeDefs,
      resolvers,
    });

    console.log("➡️ Démarrage d'Apollo Server...");
    const { url } = await startStandaloneServer(server, { // Démarrage du serveur
      listen: { port: 4000 },
      context: async () => ({ // permet de passer les repositories dans le contexte pour quil soit accessible dans les resolvers
        clientRepository,
        portRepository,
        portNeo4jRepository,
        trajetRepository,
        hydravionRepository,
        hydravionNeo4jRepository,
        lockerRepository,
      }),
    });

    console.log(`✅ Apollo Server démarré`);
    console.log(`🌍 Serveur GraphQL prêt sur ${url}`);
  } catch (err) {
    console.error("❌ Erreur au démarrage du serveur :", err);
  }
}

startServer(); // Lancer le serveur
