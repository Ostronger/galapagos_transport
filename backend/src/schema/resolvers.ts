import type { ClientRepository } from "../datasources/mongo/clientRepository.js";
import type { PortRepository } from "../datasources/neo4j/portRepository.js";
import type { TrajetRepository } from "../datasources/neo4j/trajetRepository.js";
import type { Hydravion, HydravionRepository } from "../datasources/mongo/hydravionRepository.js";
import type { HydravionNeo4jRepository } from "../datasources/neo4j/hydravionNeo4jRepository.js";
import neo4j from 'neo4j-driver';



export type Context = {
  clientRepository: ClientRepository;
  portRepository: PortRepository;
  trajetRepository: TrajetRepository;
  hydravionRepository: HydravionRepository;
  hydravionNeo4jRepository: HydravionNeo4jRepository;
};

export const resolvers = {
  Query: {
    _health: () => "OK",

    clients: async (_parent: unknown, _args: unknown, context: Context) => {
      return context.clientRepository.findAll();
    },

    client: async (_parent: unknown, args: { id: string }, context: Context) => {
      return context.clientRepository.findById(args.id);
    },

    ports: async (_parent: unknown, _args: unknown, context: Context) => {
      return context.portRepository.findAll();
    },

    trajets: async (_parent: unknown, _args: unknown, context: Context) => {
      return context.trajetRepository.findAll();
    },

    hydravions: async (_parent: unknown, _args: unknown, context: Context) => {
      // Récupérer les hydravions depuis MongoDB
      const [mongoHydras, neo4jHydras] = await Promise.all([
        context.hydravionRepository.findAll(),
        context.hydravionNeo4jRepository.findAllStatusWithPort(),
      ]);
      const byId = new Map(
        neo4jHydras.map((h) => [h.id, h])
      );

        return mongoHydras.map((h: Hydravion) => {
            const extra = byId.get(h.id);
        
            return {
                id: h.id,
                modele: h.modele,
                capacite: h.capacite,
                consommation: h.consommation,
                etat: extra?.etat ?? "INCONNU",
                positionPort: extra?.positionPort ?? null,
             };
         });
      },
    },
};