# Backend GraphQL – Architecture technique

Ce document décrit l’architecture technique du backend GraphQL du projet Galápagos.  
L’objectif est de fournir une API unique permettant d’accéder aux données stockées dans **MongoDB** (documents métier) et **Neo4J** (graphe de ports, îles, trajets, livraisons).

## 1. Stack technique

- **Langage** : Node.js (TypeScript ou JavaScript)
- **Serveur GraphQL** : Apollo Server
- **Base NoSQL documentaire** : MongoDB
- **Base graphe** : Neo4J
- **Drivers / clients** :
  - `mongodb` pour accéder à MongoDB
  - `neo4j-driver` pour accéder à Neo4J

## 2. Organisation du projet (côté backend)

Structure de base proposée :

```text
backend/
  src/
    index.ts            # Point d’entrée du serveur GraphQL
    schema/             
      typeDefs.ts       # Schéma GraphQL (types, Query, etc.)
      resolvers.ts      # Résolveurs GraphQL
    datasources/
      mongo/            # Accès MongoDB (clients, commandes, produits, lockers…)
        clientRepository.ts
        commandeRepository.ts
        produitRepository.ts
        lockerRepository.ts
      neo4j/            # Accès Neo4J (îles, ports, trajets, livraisons…)
        portRepository.ts
        itineraireRepository.ts
        livraisonRepository.ts
    config/
      mongo.ts          # Connexion MongoDB
      neo4j.ts          # Connexion Neo4J
  package.json
  tsconfig.json (si TypeScript)

```

## 3. Connexion aux bases de données

Le backend GraphQL doit établir deux connexions distinctes :

- une connexion à **MongoDB** pour les données métier (clients, produits, commandes, caisses, lockers),
- une connexion à **Neo4J** pour les données de graphe (îles, ports, trajets, livraisons, itinéraires).

Les URLs de connexion seront stockées dans des variables d’environnement.

### 3.1 Variables d’environnement

Dans un fichier `.env` (non versionné) :

```env
MONGODB_URI=mongodb://localhost:27017/galapagos
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=motdepasse
```

### 3.2 Connexion à MongoDB

Utilisation du driver `mongodb` pour se connecter à MongoDB.

```typescript
// src/config/mongo.ts
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const client = new MongoClient(uri);

export async function connectMongo() {
  if (!client.topology?.isConnected()) {
    await client.connect();
  }
  return client.db(); // base "galapagos"
}
```
Remarque :
	•	connectMongo() sera appelée au démarrage du serveur pour récupérer une instance de la base MongoDB.
	•	Les repositories (ex : clientRepository, commandeRepository, etc.) recevront cette instance.

### 3.3 Connexion à Neo4J

Utilisation du driver `neo4j-driver` pour se connecter à Neo4J.

```typescript
// src/config/neo4j.ts
import neo4j from "neo4j-driver";

const uri = process.env.NEO4J_URI as string;
const user = process.env.NEO4J_USER as string;
const password = process.env.NEO4J_PASSWORD as string;

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

export function getNeo4jSession() {
  return driver.session(); // session à fermer après usage
}
```

Remarque :
	•	On créé un driver global et on ouvre une session par opération.
	•	Les repositories Neo4J (ports, itinéraires, livraisons) utiliseront getNeo4jSession() pour exécuter des requêtes Cypher.

## 4. Initialisation du serveur GraphQL (Apollo Server)

Le serveur GraphQL est le point d’entrée du backend.  
Il doit :

1. Charger le schéma (`typeDefs`)
2. Charger les resolvers (`resolvers`)
3. Se connecter à MongoDB et Neo4J
4. Injecter ces connexions dans le `context` GraphQL

### 4.1 Fichier d’entrée : `src/index.ts`

Exemple en TypeScript (adaptable en JavaScript si besoin) :

```ts
// src/index.ts
import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import { typeDefs } from "./schema/typeDefs";
import { resolvers } from "./schema/resolvers";
import { connectMongo } from "./config/mongo";
import { getNeo4jSession } from "./config/neo4j";

async function startServer() {
  // Connexion à MongoDB
  const mongoDb = await connectMongo();

  // Création du serveur Apollo
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // Démarrage avec un context contenant les connexions aux bases
  const { url } = await startStandaloneServer(server, {
    context: async () => {
      return {
        mongoDb,                 // accès à la base MongoDB
        neo4jSessionFactory: getNeo4jSession, // fonction pour créer une session Neo4J
      };
    },
    listen: { port: 4000 },
  });

  console.log(`Serveur GraphQL prêt sur ${url}`);
}

startServer().catch((err) => {
  console.error("Erreur au démarrage du serveur GraphQL :", err);
});
```

### 4.2 Rôle du context GraphQL

Le context est un objet disponible dans tous les resolvers.
Ici, il contient :
	•	mongoDb : instance de la base MongoDB
	•	neo4jSessionFactory : fonction qui crée une session Neo4J

Les resolvers pourront récupérer ces éléments ainsi :

```ts
// Exemple de resolver
const resolvers = {
  Query: {
    ports: async (_parent, _args, context) => {
      const session = context.neo4jSessionFactory();
      try {
        const result = await session.run("MATCH (p:Port) RETURN p");
        // ... mapping des résultats
      } finally {
        await session.close();
      }
    },
  },
};
```
Remarque : les vrais resolvers seront définis dans src/schema/resolvers.ts, mais ce schéma montre comment ils accéderont aux bases via le context.

## 5. Schéma GraphQL côté code (`typeDefs`)

Le fichier `src/schema/typeDefs.ts` contient la version "codée" du schéma GraphQL  
basé sur la modélisation décrite dans `MODELISATION.md` (types + Query).

### 5.1 Fichier `src/schema/typeDefs.ts`

```ts
// src/schema/typeDefs.ts
import { gql } from "graphql-tag";

export const typeDefs = gql`
  type Coordonnees {
    latitude: Float!
    longitude: Float!
  }

  # Entités géographiques

  type Ile {
    id: ID!
    nom: String!
    ports: [Port!]!
  }

  type Port {
    id: ID!
    nom: String!
    coordonnees: Coordonnees!
    ile: Ile!
    lockers: [Locker!]!
    portsRelies: [Port!]!
  }

  # Lockers et caisses

  type Locker {
    id: ID!
    etat: Boolean!          # true = plein, false = vide
    port: Port!
    caisse: Caisse
  }

  type Caisse {
    id: ID!
    commande: Commande!
    produit: Produit!
    locker: Locker
    livraisons: [Livraison!]!
  }

  # Produits et clients

  type Produit {
    id: ID!
    nom: String!
    stock: Int!
  }

  type Client {
    id: ID!
    nom: String!
    commandes: [Commande!]!
  }

  # Commandes et livraisons

  type Commande {
    id: ID!
    date: String!         # ISO 8601
    client: Client!
    caisses: [Caisse!]!
    livraisons: [Livraison!]!
  }

  type Hydravion {
    id: ID!
    modele: String!
    capacite: Int!
    consommation: Float!
    livraisons: [Livraison!]!
  }

  type Livraison {
    id: ID!
    hydravion: Hydravion!
    portsDesservis: [Port!]!
    caisses: [Caisse!]!
  }

  # Requêtes principales

  type Query {
    iles: [Ile!]!
    ile(id: ID!): Ile

    ports: [Port!]!
    port(id: ID!): Port

    lockers: [Locker!]!
    locker(id: ID!): Locker

    clients: [Client!]!
    client(id: ID!): Client

    commandes: [Commande!]!
    commande(id: ID!): Commande

    hydravions: [Hydravion!]!
    hydravion(id: ID!): Hydravion

    livraisons: [Livraison!]!
    livraison(id: ID!): Livraison

    # Cas d’usage avancés (brouillon)
    itineraireOptimal(departId: ID!, arriveeId: ID!): Itineraire!
  }

  type Itineraire {
    ports: [Port!]!
    distanceTotale: Float!
    consommationTotale: Float!
  }
`;
```

### 5.2 Lien avec MODELISATION.md
	•	Les types GraphQL (Ile, Port, Locker, etc.) correspondent directement aux entités définies dans MODELISATION.md.
	•	Le type Query expose :
	•	des opérations simples de lecture (liste + détail),
	•	et une requête métier avancée itineraireOptimal, décrite dans la section “Cas d’usage”.

## 6. Accès aux données : repositories MongoDB et Neo4J

Pour éviter de mettre la logique d’accès aux données directement dans les resolvers,  
on utilise des **repositories**.  

Chaque repository a une responsabilité claire :

- côté **MongoDB** : lire/écrire des documents (clients, commandes, produits, lockers, caisses),
- côté **Neo4J** : lire/écrire les nœuds et relations du graphe (îles, ports, trajets, livraisons, itinéraires).

### 6.1 Repositories MongoDB

Exemple : `ClientRepository` pour gérer les clients.

Fichier : `src/datasources/mongo/clientRepository.ts`

```ts
// src/datasources/mongo/clientRepository.ts
import { Db, ObjectId } from "mongodb";

export class ClientRepository {
  private collection;

  constructor(db: Db) {
    this.collection = db.collection("clients");
  }

  async findAll() {
    return this.collection.find().toArray();
  }

  async findById(id: string) {
    return this.collection.findOne({ _id: new ObjectId(id) });
  }
}
```
Même principe pour d’autres collections :
	•	CommandeRepository : commandes
	•	ProduitRepository : produits
	•	LockerRepository : lockers
	•	CaisseRepository : caisses

Les resolvers recevront une instance de ces repositories via le context GraphQL.

### 6.2 Repositories Neo4J

Exemple : PortRepository pour récupérer les ports depuis le graphe.

```ts

// src/datasources/neo4j/portRepository.ts
import { Session } from "neo4j-driver";

export class PortRepository {
  private sessionFactory: () => Session;

  constructor(sessionFactory: () => Session) {
    this.sessionFactory = sessionFactory;
  }

  async findAll() {
    const session = this.sessionFactory();
    try {
      const result = await session.run(`
        MATCH (p:Port)-[:SE_TROUVE_SUR]->(i:Ile)
        RETURN p, i
      `);

      return result.records.map((record) => {
        const portNode = record.get("p");
        const ileNode = record.get("i");
        return {
          id: portNode.properties.id,
          nom: portNode.properties.nom,
          coordonnees: {
            latitude: portNode.properties.latitude,
            longitude: portNode.properties.longitude,
          },
          ile: {
            id: ileNode.properties.id,
            nom: ileNode.properties.nom,
          },
        };
      });
    } finally {
      await session.close();
    }
  }

  async findById(id: string) {
    const session = this.sessionFactory();
    try {
      const result = await session.run(
        `
        MATCH (p:Port {id: $id})-[:SE_TROUVE_SUR]->(i:Ile)
        RETURN p, i
        `,
        { id }
      );

      const record = result.records[0];
      if (!record) return null;

      const portNode = record.get("p");
      const ileNode = record.get("i");

      return {
        id: portNode.properties.id,
        nom: portNode.properties.nom,
        coordonnees: {
          latitude: portNode.properties.latitude,
          longitude: portNode.properties.longitude,
        },
        ile: {
          id: ileNode.properties.id,
          nom: ileNode.properties.nom,
        },
      };
    } finally {
      await session.close();
    }
  }
}

D’autres repositories Neo4J pourront gérer :
	•	les livraisons (LivraisonRepository)
	•	les itinéraires (ItineraireRepository) pour itineraireOptimal
	•	éventuellement les hydravions, si leur position est gérée dans le graphe.
```

### 6.3 Injection des repositories dans le context

Lors du démarrage du serveur, dans src/index.ts, on peut créer et injecter les repositories :

```ts
// extrait de src/index.ts (idée générale)
import { ClientRepository } from "./datasources/mongo/clientRepository";
import { PortRepository } from "./datasources/neo4j/portRepository";

async function startServer() {
  const mongoDb = await connectMongo();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    context: async () => {
      return {
        mongoDb,
        clientRepository: new ClientRepository(mongoDb),
        portRepository: new PortRepository(getNeo4jSession),
        // autres repositories à ajouter ici
      };
    },
  });

  console.log(`🚀 Serveur GraphQL prêt sur ${url}`);
}
```
Les resolvers pourront ensuite utiliser :
context.clientRepository, context.portRepository, etc.

## 7. Résolveurs GraphQL : exemples concrets

Les resolvers font le lien entre :

- le schéma GraphQL (`typeDefs`),
- les repositories (MongoDB / Neo4J),
- et le `context` (dans lequel sont injectés les repositories).

Cette section montre **deux exemples complets** :

1. `Query.ports` → lecture des ports (Neo4J)  
2. `Query.client` → lecture d’un client par id (MongoDB)

### 7.1 Fichier `src/schema/resolvers.ts`

```ts
// src/schema/resolvers.ts
import { ClientRepository } from "../datasources/mongo/clientRepository";
import { PortRepository } from "../datasources/neo4j/portRepository";

type Context = {
  clientRepository: ClientRepository;
  portRepository: PortRepository;
};

export const resolvers = {
  Query: {
    // 1️ Récupérer tous les ports (depuis Neo4J)
    ports: async (_parent: unknown, _args: unknown, context: Context) => {
      return context.portRepository.findAll();
    },

    // 2️ Récupérer un port par id (Neo4J)
    port: async (_parent: unknown, args: { id: string }, context: Context) => {
      return context.portRepository.findById(args.id);
    },

    // 3️ Récupérer tous les clients (MongoDB)
    clients: async (_parent: unknown, _args: unknown, context: Context) => {
      return context.clientRepository.findAll();
    },

    // 4️ Récupérer un client par id (MongoDB)
    client: async (_parent: unknown, args: { id: string }, context: Context) => {
      return context.clientRepository.findById(args.id);
    },
  },

  // Résolveurs de champs (optionnel, peut être complété plus tard)
  Port: {
    // Exemple : si `portRepository.findAll()` ne renvoie pas les lockers,
    // on pourrait ici aller chercher les lockers depuis MongoDB ou Neo4J.
    // lockers: ...
  },

  Client: {
    // Exemple : charger les commandes du client (depuis MongoDB)
    // commandes: ...
  },
};
```
### 7.2 Lien avec les repositories et le context

Dans src/index.ts, les repositories sont injectés dans le context :

```ts
// extrait (rappel)
import { ClientRepository } from "./datasources/mongo/clientRepository";
import { PortRepository } from "./datasources/neo4j/portRepository";

async function startServer() {
  const mongoDb = await connectMongo();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    context: async () => {
      return {
        mongoDb,
        clientRepository: new ClientRepository(mongoDb),
        portRepository: new PortRepository(getNeo4jSession),
      };
    },
  });

  console.log(`Serveur GraphQL prêt sur ${url}`);
}
```
Ainsi :
	•	Query.ports et Query.port utilisent context.portRepository (Neo4J),
	•	Query.clients et Query.client utilisent context.clientRepository (MongoDB).




