import type { ClientRepository } from "../datasources/mongo/clientRepository.js";
import type { PortRepository } from "../datasources/neo4j/portRepository.js";
import type { TrajetRepository } from "../datasources/neo4j/trajetRepository.js";

export type Context = {
  clientRepository: ClientRepository;
  portRepository: PortRepository;
  trajetRepository: TrajetRepository;
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
    }
  },
};