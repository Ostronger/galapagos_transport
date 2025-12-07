import type { ClientRepository } from "../datasources/mongo/clientRepository.js";
import type { PortRepository } from "../datasources/mongo/portRepository.js";
import type { PortNeo4jRepository } from "../datasources/neo4j/portRepository.js";
import type { TrajetRepository } from "../datasources/neo4j/trajetRepository.js";
import type {
  Hydravion,
  HydravionRepository,
} from "../datasources/mongo/hydravionRepository.js";
import type { HydravionNeo4jRepository } from "../datasources/neo4j/hydravionRepository.js";
import type { LockerRepository } from "../datasources/mongo/lockerRepository.js";
import type { CommandeRepository } from "../datasources/mongo/commandeRepository.js";
import type { ProduitRepository } from "../datasources/mongo/produitRepository.js";
import type { LivraisonRepository } from "../datasources/mongo/livraisonRepository.js";

export type Context = {
  clientRepository: ClientRepository;
  portRepository: PortRepository;
  portNeo4jRepository: PortNeo4jRepository;
  trajetRepository: TrajetRepository;
  hydravionRepository: HydravionRepository;
  hydravionNeo4jRepository: HydravionNeo4jRepository;
  lockerRepository: LockerRepository;
  commandeRepository: CommandeRepository;
  produitRepository: ProduitRepository;
  livraisonRepository: LivraisonRepository;
};

export const resolvers = {
  Query: {
    _health: () => "OK",

    // ========== HYDRAVIONS ==========
    hydravions: async (_: any, __: any, { hydravionRepository }: Context) => {
      return await hydravionRepository.findAll();
    },

    hydravion: async (
      _: any,
      { id }: { id: string },
      { hydravionRepository }: Context
    ) => {
      return await hydravionRepository.findById(id);
    },

    hydravionsDisponibles: async (
      _: any,
      __: any,
      { hydravionRepository }: Context
    ) => {
      const hydravions = await hydravionRepository.findAll();
      return hydravions.filter(
        (h) => h.etat === "PORT" || h.etat === "ENTREPOT"
      );
    },

    // ========== PORTS & ÎLES ==========
    ports: async (_: any, __: any, { portRepository }: Context) => {
      return await portRepository.findAll();
    },

    port: async (
      _: any,
      { id }: { id: string },
      { portRepository }: Context
    ) => {
      return await portRepository.findById(id);
    },

    iles: async (_: any, __: any, { portNeo4jRepository }: Context) => {
      return await portNeo4jRepository.findAllIles();
    },

    // ========== PRODUITS & STOCK ==========
    produits: async (_: any, __: any, { produitRepository }: Context) => {
      return await produitRepository.findAll();
    },

    produit: async (
      _: any,
      { id }: { id: string },
      { produitRepository }: Context
    ) => {
      return await produitRepository.findById(id);
    },

    stocksProduits: async (_: any, __: any, { produitRepository }: Context) => {
      return await produitRepository.findAll();
    },

    // ========== CLIENTS & COMMANDES ==========
    clients: async (_: any, __: any, { clientRepository }: Context) => {
      return await clientRepository.findAll();
    },

    client: async (
      _: any,
      { id }: { id: string },
      { clientRepository }: Context
    ) => {
      return await clientRepository.findById(id);
    },

    commande: async (
      _: any,
      { id }: { id: string },
      { commandeRepository }: Context
    ) => {
      return await commandeRepository.findById(id);
    },

    commandesEnCours: async (
      _: any,
      __: any,
      { commandeRepository }: Context
    ) => {
      return await commandeRepository.findEnCours();
    },

    // ========== LIVRAISONS ==========
    livraisons: async (_: any, __: any, { livraisonRepository }: Context) => {
      return await livraisonRepository.findAll();
    },

    livraisonsClient: async (
      _: any,
      { clientId }: { clientId: string },
      { livraisonRepository }: Context
    ) => {
      return await livraisonRepository.findByClientId(clientId);
    },

    historiqueLivraisonsClient: async (
      _: any,
      { clientId }: { clientId: string },
      { livraisonRepository }: Context
    ) => {
      const livraisons = await livraisonRepository.findByClientId(clientId);
      return livraisons.filter((l) => l.statut === "LIVREE");
    },

    toutesLivraisonsClient: async (
      _: any,
      { clientId }: { clientId: string },
      { livraisonRepository }: Context
    ) => {
      return await livraisonRepository.findByClientId(clientId);
    },

    // ========== LOCKERS ==========
    lockersParPort: async (
      _: any,
      { portId, filtreVide }: { portId: string; filtreVide?: boolean },
      { lockerRepository }: Context
    ) => {
      return await lockerRepository.findByPortId(portId, filtreVide);
    },

    lockersVides: async (_: any, __: any, { lockerRepository }: Context) => {
      const lockers = await lockerRepository.findAll();
      return lockers.filter((l) => !l.plein);
    },

    lockersParIle: async (
      _: any,
      { ileId }: { ileId: string },
      { portRepository, lockerRepository }: Context
    ) => {
      const ports = await portRepository.findAll();
      const portsIle = ports.filter((p) => p.ile?.id === ileId);
      const lockers = [];

      for (const port of portsIle) {
        const lockersPort = await lockerRepository.findByPortId(port.id);
        lockers.push(...lockersPort);
      }

      return lockers;
    },

    // ========== TRAJETS & OPTIMISATION ==========
    trajets: async (_: any, __: any, { trajetRepository }: Context) => {
      return await trajetRepository.findAll();
    },

    calculerItineraireOptimal: async (
      _: any,
      {
        hydravionId,
        portsCibles,
      }: { hydravionId: string; portsCibles: string[] },
      { hydravionRepository, trajetRepository }: Context
    ) => {
      const hydravion = await hydravionRepository.findById(hydravionId);
      if (!hydravion) throw new Error("Hydravion non trouvé");

      return await trajetRepository.calculerItineraireOptimal(
        hydravion.positionPort?.id || hydravion.positionGPS,
        portsCibles,
        hydravion.consommationKm
      );
    },

    calculerConsommationCarburant: async (
      _: any,
      { hydravionId, distance }: { hydravionId: string; distance: number },
      { hydravionRepository }: Context
    ) => {
      const hydravion = await hydravionRepository.findById(hydravionId);
      if (!hydravion) throw new Error("Hydravion non trouvé");

      return hydravion.consommationKm * distance;
    },
  },

  Mutation: {
    // ========== COMMANDES ==========
    creerCommande: async (
      _: any,
      { input }: { input: { clientId: string; caisseIds: string[] } },
      { commandeRepository }: Context
    ) => {
      return await commandeRepository.create(input);
    },

    annulerCommande: async (
      _: any,
      { id }: { id: string },
      { commandeRepository }: Context
    ) => {
      return await commandeRepository.updateStatut(id, "ANNULEE");
    },

    // ========== LIVRAISONS ==========
    creerLivraison: async (
      _: any,
      { input }: { input: any },
      { livraisonRepository }: Context
    ) => {
      return await livraisonRepository.create(input);
    },

    demarrerLivraison: async (
      _: any,
      { id }: { id: string },
      { livraisonRepository }: Context
    ) => {
      return await livraisonRepository.demarrer(id);
    },

    terminerLivraison: async (
      _: any,
      { id }: { id: string },
      { livraisonRepository }: Context
    ) => {
      return await livraisonRepository.terminer(id);
    },

    // ========== HYDRAVIONS ==========
    deplacerHydravion: async (
      _: any,
      { id, portId }: { id: string; portId: string },
      { hydravionRepository }: Context
    ) => {
      const hydravion = await hydravionRepository.findById(id);
      if (!hydravion) throw new Error("Hydravion non trouvé");

      // Mise à jour de la position
      hydravion.positionPort = portId as any;
      hydravion.etat = "PORT";

      return hydravion;
    },

    ravitaillerHydravion: async (
      _: any,
      { id, quantite }: { id: string; quantite: number },
      { hydravionRepository }: Context
    ) => {
      const hydravion = await hydravionRepository.findById(id);
      if (!hydravion) throw new Error("Hydravion non trouvé");

      hydravion.niveauCarburant = Math.min(
        hydravion.niveauCarburant + quantite,
        hydravion.niveauCarburantMax
      );

      return hydravion;
    },

    // ========== LOCKERS ==========
    assignerCaisseAuLocker: async (
      _: any,
      { lockerId, caisseId }: { lockerId: string; caisseId: string },
      { lockerRepository }: Context
    ) => {
      // Logique à implémenter
      throw new Error("Non implémenté");
    },

    libererLocker: async (
      _: any,
      { lockerId }: { lockerId: string },
      { lockerRepository }: Context
    ) => {
      // Logique à implémenter
      throw new Error("Non implémenté");
    },
  },

  // Resolvers pour les types imbriqués

  Hydravion: {
    positionPort: async (parent: any, _: any, { portRepository }: Context) => {
      if (parent.positionPort && typeof parent.positionPort === "object") {
        return parent.positionPort;
      }
      if (parent.positionPortId) {
        return await portRepository.findById(parent.positionPortId);
      }
      return null;
    },
  },

  Port: {
    nbLockersVides: async (
      parent: any,
      _: any,
      { lockerRepository }: Context
    ) => {
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
    historiqueCommandes: async (
      parent: any,
      _: any,
      { commandeRepository }: Context
    ) => {
      const commandes = await commandeRepository.findByClientId(parent.id);
      return commandes;
    },
  },

  Commande: {
    client: async (parent: any, _: any, { clientRepository }: Context) => {
      return await clientRepository.findById(parent.clientId);
    },
    caisses: async (parent: any, _: any, { commandeRepository }: Context) => {
      return await commandeRepository.getCaisses(parent.id);
    },
  },

  Livraison: {
    commande: async (parent: any, _: any, { commandeRepository }: Context) => {
      return await commandeRepository.findById(parent.commandeId);
    },
    hydravion: async (
      parent: any,
      _: any,
      { hydravionRepository }: Context
    ) => {
      return await hydravionRepository.findById(parent.hydravionId);
    },
    portDepart: async (parent: any, _: any, { portRepository }: Context) => {
      return await portRepository.findById(parent.portDepartId);
    },
    portArrivee: async (parent: any, _: any, { portRepository }: Context) => {
      return await portRepository.findById(parent.portArriveeId);
    },
    caisses: async (parent: any, _: any, { commandeRepository }: Context) => {
      if (!parent.caisses || parent.caisses.length === 0) {
        return [];
      }
      return await commandeRepository.getCaisses(parent.commandeId);
    },
  },
};
