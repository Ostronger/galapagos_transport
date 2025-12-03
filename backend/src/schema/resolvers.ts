import type { ClientRepository } from "../datasources/mongo/clientRepository.js";
import type { PortRepository } from "../datasources/neo4j/portRepository.js";
import type { TrajetRepository } from "../datasources/neo4j/trajetRepository.js";
import type { Hydravion, HydravionRepository } from "../datasources/mongo/hydravionRepository.js";
import type { HydravionNeo4jRepository } from "../datasources/neo4j/hydravionNeo4jRepository.js";
import type { LockerRepository } from "../datasources/mongo/lockerRepository.js";




export type Context = {
  clientRepository: ClientRepository;
  portRepository: PortRepository;
  trajetRepository: TrajetRepository;
  hydravionRepository: HydravionRepository;
  hydravionNeo4jRepository: HydravionNeo4jRepository;
  lockerRepository: LockerRepository;
};

export const resolvers = {
  Query: {
    _health: () => "OK", // verifie le bon fonctionnement du serveur

    clients: async (_parent: unknown, _args: unknown, context: Context) => {
      return context.clientRepository.findAll(); // Récupérer tous les clients
    },

    client: async (_parent: unknown, args: { id: string }, context: Context) => {
      return context.clientRepository.findById(args.id); // Récupérer un client par son ID
    },

    ports: async (_parent: unknown, _args: unknown, context: Context) => {
      return context.portRepository.findAll(); // Récupérer tous les ports
    },

    trajets: async (_parent: unknown, _args: unknown, context: Context) => {
      return context.trajetRepository.findAll(); // Récupérer tous les trajets
    },

    hydravions: async (_parent: unknown, _args: unknown, context: Context) => { 
      // Récupérer les hydravions en combinant les données de MongoDB et Neo4j
      const [mongoHydras, neo4jHydras] = await Promise.all([ // exécuter les deux requêtes en parallèle
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

    lockers: async (_parent: unknown, _args: unknown, context: Context) => {
      return context.lockerRepository.findAll();     // Récupérer tous les lockers
    },
  },
};