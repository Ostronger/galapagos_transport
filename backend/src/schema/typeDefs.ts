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
    produits: [Produit!]!
    statut: String!
  }

  type Produit {
    id: ID!
    nom: String!
    quantiteStocks: Int!
  }

  type Trajet {
    id: ID!
    portDepart: Port!
    portArrivee: Port!
    distanceKm: Float!
    dureeMinutes: Int!
  }

  # Pour le résultat de l'algorithme d'optimisation
  type Itineraire {
    portsOrdonnes: [Port!]! # L'ordre de passage calculé
    distanceTotale: Float!
    carburantNecessaire: Float! #
  }

  type Query {
    _health: String!

    hydravions: [Hydravion!]!
    ports: [Port!]!
    produits: [Produit!]!

    client(id: ID!): Client

    # parcours optimise pour le trajet
    calculerItineraires(
      hydravionId: ID!
      portCibleId: [ID!]!
    ): Itineraire

    # Savoir où sont les lockers vides sur une île
    getLockersParPort(portId: ID!, filtreVide: Boolean): [Locker!]!


#    clients: [Client!]!
#    client(id: ID!): Client
#    ports: [Port!]!
#    trajets: [Trajet!]!
#    trajetsEntrePorts(portDepartId: ID!, portArriveeId: ID!): [Trajet!]!
#    hydravions: [Hydravion!]!
#    lockers: [Locker!]!
  }
`;
