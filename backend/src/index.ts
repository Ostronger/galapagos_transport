import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import { typeDefs } from "./schema/typeDefs.js";
import { resolvers } from "./schema/resolvers.js";
import { connectMongo } from "./config/mongo.js";
import { ClientRepository } from "./datasources/mongo/clientRepository.js";
import { getNeo4jSession } from "./config/neo4j.js";
import { PortRepository } from "./datasources/neo4j/portRepository.js";
import { TrajetRepository } from "./datasources/neo4j/trajetRepository.js";

async function startServer() {
  console.log("Démarrage du serveur GraphQL...");

  try {
    console.log("➡️ Connexion à MongoDB...");
    const mongoDb = await connectMongo();
    console.log("✅ MongoDB connecté avec succès");

    const clientRepository = new ClientRepository(mongoDb);
    const portRepository = new PortRepository(getNeo4jSession);
    const trajetRepository = new TrajetRepository(getNeo4jSession);

    const server = new ApolloServer({
      typeDefs,
      resolvers,
    });

    console.log("➡️ Démarrage d'Apollo Server...");
    const { url } = await startStandaloneServer(server, {
      listen: { port: 4000 },
      context: async () => ({
        clientRepository,
        portRepository,
        trajetRepository,
      }),
    });

    console.log(`✅ Apollo Server démarré`);
    console.log(`🌍 Serveur GraphQL prêt sur ${url}`);
  } catch (err) {
    console.error("❌ Erreur au démarrage du serveur :", err);
  }
}

startServer();