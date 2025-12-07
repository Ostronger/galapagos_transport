import type { ClientRepository } from "../datasources/mongo/clientRepository.js";
import type { PortRepository } from "../datasources/mongo/portRepository.js";
import type { PortNeo4jRepository } from "../datasources/neo4j/portRepository.js";
import type { TrajetRepository } from "../datasources/neo4j/trajetRepository.js";
import type { HydravionRepository } from "../datasources/mongo/hydravionRepository.js";
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

    // ========== HYDRAVIONS ========== \\
    hydravions: async (
      parent: any,
      args: any,
      { hydravionRepository }: Context
    ) => {
      return await hydravionRepository.findAll();
    },

    hydravion: async (
      parent: any,
      { id }: { id: string },
      { hydravionRepository }: Context
    ) => {
      return await hydravionRepository.findById(id);
    },

    hydravionsDisponibles: async (
      parent: any,
      args: any,
      { hydravionRepository }: Context
    ) => {
      const hydravions = await hydravionRepository.findAll();
      return hydravions.filter(
        (h) => h.etat === "PORT" || h.etat === "ENTREPOT"
      );
    },

    // ========== PORTS & ÎLES ========== \\
    ports: async (parent: any, args: any, { portRepository }: Context) => {
      return await portRepository.findAll();
    },

    port: async (
      parent: any,
      { id }: { id: string },
      { portRepository }: Context
    ) => {
      return await portRepository.findById(id);
    },

    iles: async (parent: any, args: any, { portNeo4jRepository }: Context) => {
      return await portNeo4jRepository.findAllIles();
    },

    // ========== PRODUITS & STOCK ========== \\
    produits: async (
      parent: any,
      args: any,
      { produitRepository }: Context
    ) => {
      return await produitRepository.findAll();
    },

    produit: async (
      parent: any,
      { id }: { id: string },
      { produitRepository }: Context
    ) => {
      return await produitRepository.findById(id);
    },

    // ========== CLIENTS & COMMANDES ========== \\
    clients: async (parent: any, args: any, { clientRepository }: Context) => {
      return await clientRepository.findAll();
    },

    client: async (
      parent: any,
      { id }: { id: string },
      { clientRepository }: Context
    ) => {
      return await clientRepository.findById(id);
    },

    commande: async (
      parent: any,
      { id }: { id: string },
      { commandeRepository }: Context
    ) => {
      return await commandeRepository.findById(id);
    },

    commandesEnCours: async (
      parent: any,
      args: any,
      { commandeRepository }: Context
    ) => {
      return await commandeRepository.findEnCours();
    },

    // ========== LIVRAISONS ==========
    livraisons: async (
      parent: any,
      args: any,
      { livraisonRepository }: Context
    ) => {
      return await livraisonRepository.findAll();
    },

    livraisonsClient: async (
      parent: any,
      { clientId }: { clientId: string },
      { livraisonRepository }: Context
    ) => {
      return await livraisonRepository.findByClientId(clientId);
    },

    historiqueLivraisonsClient: async (
      parent: any,
      { clientId }: { clientId: string },
      { livraisonRepository }: Context
    ) => {
      const livraisons = await livraisonRepository.findByClientId(clientId);
      return livraisons.filter((l) => l.statut === "LIVREE");
    },

    toutesLivraisonsClient: async (
      parent: any,
      { clientId }: { clientId: string },
      { livraisonRepository }: Context
    ) => {
      return await livraisonRepository.findByClientId(clientId);
    },

    // ========== LOCKERS ==========
    lockersParPort: async (
      parent: any,
      { portId, filtreVide }: { portId: string; filtreVide?: boolean },
      { lockerRepository }: Context
    ) => {
      return await lockerRepository.findByPortId(portId, filtreVide);
    },

    lockersVides: async (
      parent: any,
      args: any,
      { lockerRepository }: Context
    ) => {
      const lockers = await lockerRepository.findAll();
      return lockers.filter((l) => !l.plein);
    },

    lockersParIle: async (
      parent: any,
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
    trajets: async (parent: any, args: any, { trajetRepository }: Context) => {
      return await trajetRepository.findAll();
    },

    calculerItineraireOptimal: async (
      parent: any,
      {
        hydravionId,
        portsCibles,
      }: { hydravionId: string; portsCibles: string[] },
      { trajetRepository, hydravionRepository, portRepository }: Context
    ) => {
      // 1. Vérifier que l'hydravion existe
      const hydravion = await hydravionRepository.findById(hydravionId);
      if (!hydravion) throw new Error("Hydravion non trouvé");

      // 2. Calculer l'itinéraire optimal
      const resultat = await trajetRepository.calculerItineraireOptimal(
        portsCibles
      );

      // 3. Récupérer les informations complètes des ports
      const portsComplets = await Promise.all(
        resultat.portsOrdonnes.map(async (p) => {
          const port = await portRepository.findById(p.id);
          return port || p;
        })
      );

      // 4. Calculer la consommation de carburant
      const carburantNecessaire =
        resultat.distanceTotale * hydravion.consommationKm;

      return {
        portsOrdonnes: portsComplets,
        distanceTotale: resultat.distanceTotale,
        carburantNecessaire,
      };
    },

    calculerItineraireOptimalParLivraisons: async (
      parent: any,
      {
        hydravionId,
        livraisonIds,
      }: { hydravionId: string; livraisonIds: string[] },
      {
        trajetRepository,
        hydravionRepository,
        portRepository,
        livraisonRepository,
      }: Context
    ) => {
      // 1. Vérifier que l'hydravion existe
      const hydravion = await hydravionRepository.findById(hydravionId);
      if (!hydravion) throw new Error("Hydravion non trouvé");

      // 2. Récupérer les livraisons
      const livraisons = await Promise.all(
        livraisonIds.map((id) => livraisonRepository.findById(id))
      );

      const livraisonsValides = livraisons.filter((l) => l !== null);
      if (livraisonsValides.length === 0) {
        throw new Error("Aucune livraison valide trouvée");
      }

      // 3. Extraire les ports de destination uniques
      const portsCibles = Array.from(
        new Set(livraisonsValides.map((l) => l!.portArriveeId))
      );

      // 4. Vérifier la capacité
      let totalCaisses = 0;
      for (const livraison of livraisonsValides) {
        totalCaisses += livraison!.caisses.length;
      }

      if (totalCaisses > hydravion.capaciteMax) {
        throw new Error(
          `Capacité insuffisante: ${totalCaisses} caisses pour ${hydravion.capaciteMax} places disponibles`
        );
      }

      // 5. Calculer l'itinéraire optimal
      const resultat = await trajetRepository.calculerItineraireOptimal(
        portsCibles
      );

      // 6. Récupérer les informations complètes des ports
      const portsComplets = await Promise.all(
        resultat.portsOrdonnes.map(async (p) => {
          const port = await portRepository.findById(p.id);
          return port || p;
        })
      );

      // 7. Calculer la consommation de carburant
      const carburantNecessaire =
        resultat.distanceTotale * hydravion.consommationKm;

      return {
        portsOrdonnes: portsComplets,
        distanceTotale: resultat.distanceTotale,
        carburantNecessaire,
        livraisons: livraisonsValides,
        capaciteUtilisee: totalCaisses,
        capaciteMax: hydravion.capaciteMax,
      };
    },

    calculerConsommationCarburant: async (
      parent: any,
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
      parent: any,
      { input }: { input: { clientId: string; caisseIds: string[] } },
      { commandeRepository }: Context
    ) => {
      return await commandeRepository.create(input);
    },

    annulerCommande: async (
      parent: any,
      { id }: { id: string },
      { commandeRepository }: Context
    ) => {
      return await commandeRepository.updateStatut(id, "ANNULEE");
    },

    // ========== LIVRAISONS ==========
    creerLivraison: async (
      parent: any,
      { input }: { input: any },
      { livraisonRepository }: Context
    ) => {
      return await livraisonRepository.create(input);
    },

    demarrerLivraison: async (
      parent: any,
      { id }: { id: string },
      { livraisonRepository }: Context
    ) => {
      return await livraisonRepository.demarrer(id);
    },

    terminerLivraison: async (
      parent: any,
      { id }: { id: string },
      { livraisonRepository }: Context
    ) => {
      return await livraisonRepository.terminer(id);
    },

    // ========== HYDRAVIONS ==========
    deplacerHydravion: async (
      parent: any,
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
      parent: any,
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
      parent: any,
      { lockerId, caisseId }: { lockerId: string; caisseId: string },
      { lockerRepository }: Context
    ) => {
      // Logique à implémenter
      throw new Error("Non implémenté");
    },

    libererLocker: async (
      parent: any,
      { lockerId }: { lockerId: string },
      { lockerRepository }: Context
    ) => {
      // Logique à implémenter
      throw new Error("Non implémenté");
    },
  },

  // Resolvers pour les types imbriqués

  Hydravion: {
    positionPort: async (
      parent: any,
      args: any,
      { portRepository }: Context
    ) => {
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
      args: any,
      { lockerRepository }: Context
    ) => {
      const lockers = await lockerRepository.findByPortId(parent.id, true);
      return lockers.length;
    },
    ile: (parent: any) => parent.ile, // retourne l'objet Ile
  },

  Locker: {
    contenu: async (parent: any, args: any, { lockerRepository }: Context) => {
      if (parent.estVide) return null;
      return await lockerRepository.findCaisseById(parent.caisseId);
    },
  },

  Caisse: {
    client: async (parent: any, args: any, { clientRepository }: Context) => {
      return await clientRepository.findById(parent.clientId);
    },
  },

  Client: {
    historiqueCommandes: async (
      parent: any,
      args: any,
      { commandeRepository }: Context
    ) => {
      const commandes = await commandeRepository.findByClientId(parent.id);
      return commandes;
    },
  },

  Commande: {
    client: async (parent: any, args: any, { clientRepository }: Context) => {
      return await clientRepository.findById(parent.clientId);
    },
    caisses: async (
      parent: any,
      args: any,
      { commandeRepository }: Context
    ) => {
      return await commandeRepository.getCaisses(parent.id);
    },
  },

  Livraison: {
    commande: async (
      parent: any,
      args: any,
      { commandeRepository }: Context
    ) => {
      return await commandeRepository.findById(parent.commandeId);
    },
    hydravion: async (
      parent: any,
      args: any,
      { hydravionRepository }: Context
    ) => {
      return await hydravionRepository.findById(parent.hydravionId);
    },
    portDepart: async (parent: any, args: any, { portRepository }: Context) => {
      return await portRepository.findById(parent.portDepartId);
    },
    portArrivee: async (
      parent: any,
      args: any,
      { portRepository }: Context
    ) => {
      return await portRepository.findById(parent.portArriveeId);
    },
    caisses: async (
      parent: any,
      args: any,
      { commandeRepository }: Context
    ) => {
      if (!parent.caisses || parent.caisses.length === 0) {
        return [];
      }
      return await commandeRepository.getCaisses(parent.commandeId);
    },
  },

  // Transformer les objets Port en IDs pour le type Trajet
  Trajet: {
    portDepart: (parent: any) => {
      return typeof parent.portDepart === "string"
        ? parent.portDepart
        : parent.portDepart?.id || "";
    },
    portArrivee: (parent: any) => {
      return typeof parent.portArrivee === "string"
        ? parent.portArrivee
        : parent.portArrivee?.id || "";
    },
  },
};
