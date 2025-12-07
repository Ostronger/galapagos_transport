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

    # Trajets & Optimisation
    trajets: [Trajet!]!
  }
`;
