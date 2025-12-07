import { gql } from "graphql-tag"; // Importer la fonction gql pour définir le schéma GraphQL

export const typeDefs = gql`
  scalar Date

  type Hydravion {
    id: ID!
    modele: String!
    capaciteActuelle: Int!
    capaciteMax: Int!
    consommationKm: Float!
    niveauCarburant: Float!
    niveauCarburantMax: Float!
    etat: EtatHydravion!
    positionPort: Port
    positionGPS: Coordonnees
    caisses: [String!]
  }

  enum EtatHydravion {
    PORT
    EN_VOL
    ENTREPOT
  }

  type Coordonnees {
    latitude: Float!
    longitude: Float!
  }

  type Ile {
    id: ID!
    nom: String!
  }

  type Entrepot {
    id: ID!
    nom: String!
    coordonnees: Coordonnees!
    ile: Ile!
    capacite: Int!
    capaciteMax: Int!
  }

  type Port {
    id: ID!
    nom: String!
    coordonnees: Coordonnees!
    ile: Ile!
    capaciteHydravions: Int!
    capaciteHydravionsMax: Int!
    lockers: [String!]! # tableau d'identifiants
    nbLockersVides: Int!
  }

  type Locker {
    id: ID!
    estVide: Boolean!
    contenu: Caisse
  }

  type Caisse {
    id: ID!
    nom: String!
    client: Client!
  }

  type Client {
    id: ID!
    nom: String!
    historiqueCommandes: [Commande!]
  }

  type Commande {
    id: ID!
    date: Date!
    client: Client!
    caisses: [Caisse!]!
    statut: StatutCommande!
  }

  enum StatutCommande {
    EN_PREPARATION
    EN_COURS
    LIVREE
    ANNULEE
  }

  type Produit {
    id: ID!
    nom: String!
    quantiteStocks: Int!
  }

  type Livraison {
    id: ID!
    commande: Commande!
    hydravion: Hydravion!
    portDepart: Port!
    portArrivee: Port!
    dateDepart: Date
    dateArrivee: Date
    statut: StatutLivraison!
    caisses: [Caisse!]!
  }

  enum StatutLivraison {
    PLANIFIEE
    EN_COURS
    LIVREE
    ANNULEE
  }

  type Trajet {
    id: ID!
    portDepart: String!
    portArrivee: String!
    distanceKm: Float!
    dureeMinutes: Int!
  }

  # Pour le résultat de l'algorithme d'optimisation
  type Itineraire {
    portsOrdonnes: [Port!]! # L'ordre de passage calculé
    distanceTotale: Float!
    carburantNecessaire: Float!
  }

  # Pour l'optimisation avec livraisons
  type ItineraireAvecLivraisons {
    portsOrdonnes: [Port!]!
    distanceTotale: Float!
    carburantNecessaire: Float!
    livraisons: [Livraison!]! # Les livraisons dans l'ordre
    capaciteUtilisee: Int! # Nombre de caisses transportées
    capaciteMax: Int! # Capacité max de l'hydravion
  }

  type Query {
    _health: String!

    # Hydravions
    hydravions: [Hydravion!]!
    hydravion(id: ID!): Hydravion
    hydravionsDisponibles: [Hydravion!]!

    # Ports & Îles
    ports: [Port!]!
    port(id: ID!): Port
    iles: [Ile!]!

    # Produits & Stock
    produits: [Produit!]!
    produit(id: ID!): Produit
    stocksProduits: [Produit!]!

    # Clients & Commandes
    clients: [Client!]!
    client(id: ID!): Client
    commande(id: ID!): Commande
    commandesEnCours: [Commande!]!

    # Livraisons
    livraisons: [Livraison!]!
    livraisonsClient(clientId: ID!): [Livraison!]!
    historiqueLivraisonsClient(clientId: ID!): [Livraison!]!
    toutesLivraisonsClient(clientId: ID!): [Livraison!]!

    # Lockers
    lockersParPort(portId: ID!, filtreVide: Boolean): [Locker!]!
    lockersVides: [Locker!]!
    lockersParIle(ileId: ID!): [Locker!]!

    # Trajets & Optimisation
    trajets: [Trajet!]!

    # Calcule l'itinéraire optimal pour livrer une liste de ports
    calculerItineraireOptimal(hydravionId: ID!, portsCibles: [ID!]!): Itineraire

    # Calcule l'itinéraire optimal pour une liste de livraisons
    calculerItineraireOptimalParLivraisons(
      hydravionId: ID!
      livraisonIds: [ID!]!
    ): ItineraireAvecLivraisons

    calculerConsommationCarburant(hydravionId: ID!, distance: Float!): Float!
  }

  type Mutation {
    # Commandes
    creerCommande(input: CommandeInput!): Commande!
    annulerCommande(id: ID!): Commande!

    # Livraisons
    creerLivraison(input: LivraisonInput!): Livraison!
    demarrerLivraison(id: ID!): Livraison!
    terminerLivraison(id: ID!): Livraison!

    # Hydravions
    deplacerHydravion(id: ID!, portId: ID!): Hydravion!
    ravitaillerHydravion(id: ID!, quantite: Float!): Hydravion!

    # Lockers
    assignerCaisseAuLocker(lockerId: ID!, caisseId: ID!): Locker!
    libererLocker(lockerId: ID!): Locker!
  }

  input CommandeInput {
    clientId: ID!
    caisseIds: [ID!]!
  }

  input LivraisonInput {
    commandeId: ID!
    hydravionId: ID!
    portDepartId: ID!
    portArriveeId: ID!
  }
`;
