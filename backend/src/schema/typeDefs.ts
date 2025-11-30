import { gql } from "graphql-tag";

export const typeDefs = gql`
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

  type Query {
    _health: String!
    clients: [Client!]!
    client(id: ID!): Client
    ports: [Port!]!
  }
`;