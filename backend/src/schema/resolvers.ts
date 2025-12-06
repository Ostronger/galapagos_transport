import type { ClientRepository } from "../datasources/mongo/clientRepository.js";
import type { PortRepository } from "../datasources/mongo/portRepository.js";
import type { PortNeo4jRepository } from "../datasources/neo4j/portRepository.js";
import type { TrajetRepository } from "../datasources/neo4j/trajetRepository.js";
import type { Hydravion, HydravionRepository } from "../datasources/mongo/hydravionRepository.js";
import type { HydravionNeo4jRepository } from "../datasources/neo4j/hydravionRepository.js";
import type { LockerRepository } from "../datasources/mongo/lockerRepository.js";




export type Context = {
  clientRepository: ClientRepository;
  portRepository: PortRepository;
  portNeo4jRepository: PortNeo4jRepository;
  trajetRepository: TrajetRepository;
  hydravionRepository: HydravionRepository;
  hydravionNeo4jRepository: HydravionNeo4jRepository;
  lockerRepository: LockerRepository;
};

export const resolvers = {
  Query: {
    _health: () => "OK",

    // Récupérer tous les hydravions
    hydravions: async (_: any, __: any, { hydravionRepository }: Context) => {
      return await hydravionRepository.findAll();
    },

    // Récupérer tous les ports
    ports: async (_: any, __: any, { portRepository }: Context) => {
      return await portRepository.findAll();
    },

    // Récupérer tous les produits
    produits: async (_: any, __: any, { lockerRepository }: Context) => {
      // À adapter selon votre implémentation de produits
      return await lockerRepository.findAllProduits();
    },

    // Récupérer un client par ID
    client: async (_: any, { id }: { id: string }, { clientRepository }: Context) => {
      return await clientRepository.findById(id);
    },

    // Calculer l'itinéraire optimisé pour un hydravion vers plusieurs ports
    calculerItineraires: async (
      _: any,
      { hydravionId, portCibleId }: { hydravionId: string; portCibleId: string[] },
      { hydravionRepository, hydravionNeo4jRepository, trajetRepository }: Context
    ) => {
      // Récupérer l'hydravion
      const hydravion = await hydravionRepository.findById(hydravionId);
      if (!hydravion) throw new Error("Hydravion non trouvé");

      // Utiliser Neo4j pour calculer l'itinéraire optimal
      const itineraire = await trajetRepository.calculerItineraireOptimal(
        hydravion.positionPort?.id || hydravion.positionGPS,
        portCibleId,
        hydravion.consommationKm
      );

      return itineraire;
    },

    // Récupérer les lockers d'un port avec filtre optionnel
    getLockersParPort: async (
      _: any,
      { portId, filtreVide }: { portId: string; filtreVide?: boolean },
      { lockerRepository }: Context
    ) => {
      return await lockerRepository.findByPortId(portId, filtreVide);
    },
  },

  // Resolvers pour les types imbriqués
  Hydravion: {
    positionPort: async (parent: any, _: any, { portRepository }: Context) => {
      if (!parent.positionPortId) return null;
      return await portRepository.findById(parent.positionPortId);
    },
  },

  Port: {
    nbLockersVides: async (parent: any, _: any, { lockerRepository }: Context) => {
      const lockers = await lockerRepository.findByPortId(parent.id, true);
      return lockers.length;
    },
    ile: (parent: any) => parent.ile, // retourne l'objet Ile
  },

  Locker: {
    contenu: async (parent: any, _: any, { lockerRepository }: Context) => {
      if (parent.estVide) return null;
      return await lockerRepository.findCaisseById(parent.caisseId);
    },
  },

  Caisse: {
    client: async (parent: any, _: any, { clientRepository }: Context) => {
      return await clientRepository.findById(parent.clientId);
    },
  },

  Client: {
    historiqueCommandes: async (parent: any, _: any, { clientRepository }: Context) => {
      return await clientRepository.findCommandesByClientId(parent.id);
    },
  },

  Trajet: {
    portDepart: async (parent: any, _: any, { portRepository }: Context) => {
      return await portRepository.findById(parent.portDepartId);
    },
    portArrivee: async (parent: any, _: any, { portRepository }: Context) => {
      return await portRepository.findById(parent.portArriveeId);
    },
  },
};
