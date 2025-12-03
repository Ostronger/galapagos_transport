import { gql } from "graphql-tag"; // Importer la fonction gql pour définir le schéma GraphQL

export const typeDefs = gql`
 type Hydravion {
    id: ID!
    modele: String!
    capacite: Int!
    consommation: Float!
    etat: String!
    positionPort: Port
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
  }

  type Client {
    id: ID!
    nom: String!
  }

  type Trajet {
    id: ID!
    portDepart: Port!
    portArrivee: Port!
    distanceKm: Float!
    dureeMinutes: Int!
  }
    type Locker {
    id: ID!
    nom: String!
    capacite: Int!
    occupe: Int!
    plein: Boolean!
  }

  type Query {
    _health: String!
    clients: [Client!]!
    client(id: ID!): Client
    ports: [Port!]!
    trajets: [Trajet!]!
    trajetsEntrePorts(portDepartId: ID!, portArriveeId: ID!): [Trajet!]!
    hydravions: [Hydravion!]!
    lockers: [Locker!]!
  }
`;