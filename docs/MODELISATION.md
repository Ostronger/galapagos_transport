# Modélisation du système Galápagos

## 1. Contexte du projet

Ce projet a pour objectif de modéliser et de mettre en place un système de livraison scientifique dans l’archipel des Galápagos.  
L’entreprise Richnou Galap utilise un entrepôt central, une flotte d’hydravions, des ports sur les différentes îles, des consignes (lockers) et des produits scientifiques à livrer aux clients (scientifiques).

L’objectif est de pouvoir :
- suivre les hydravions,
- planifier et optimiser les itinéraires,
- gérer les lockers et les stocks,
- tracer les commandes et les livraisons.

## 2. Vue d’ensemble du modèle de données

### 2.1. Entités principales

- Île
- Port
- Hydravion
- Locker (consigne)
- Caisse
- Produit
- Client
- Commande
- Livraison

#### 2.1.1. Île

**Description**

Une île représente une zone géographique faisant partie de l’archipel des Galápagos.Chaque île possède un nom et des coordonnées générales. Certaines îles possèdent plusieurs ports, d’autres seulement un.

**Attributs**

Attributs   | Type     | Description
------------|----------|-----------------------------
id          | Integer  | Identifiant unique de l’île
nom         | String   | Nom de l’île
coordonnees | String   | Coordonnées géographiques de l’île

**Relations**
- Une île peut posséder un ou plusieurs ports.
(relation : ÎLE → PORT)

**stockage des données** : Neo4j (île entité géographique relier aux ports)

#### 2.1.2. Port

 **Description**

Un port représente un point d’atterrissage et de départ pour les hydravions sur une île donnée.  
C’est aussi l’endroit où sont installés les lockers (consignes) utilisés pour déposer et récupérer les colis.

Chaque port est donc :
- situé sur une seule île,
- potentiellement connecté à plusieurs autres ports (trajets entre ports),
- équipé de zéro, un ou plusieurs lockers.

**Attributs**

| Attribut       | Type          | Description 
|----------------|---------------|-------------
| id             | ID            | Identifiant unique du port 
| nom            | String        | Nom du port (ex : "Puerto Baquerizo Moreno") 
| coordonnees    | Point / GPS   | Coordonnées géographiques (latitude, longitude) du port 

> Remarque : `coordonnees` pourra être stocké sous forme de `point` (Neo4J) ou `{ lat, lng }` (MongoDB).

**Relations**

- Un **port** est situé sur **une seule île**  
  - `(PORT) -[:SE_TROUVE_SUR]-> (ÎLE)`
- Un **port** possède **zéro, un ou plusieurs lockers**  
  - `(PORT) -[:POSSEDE]-> (LOCKER)`
- Des **ports** peuvent être reliés entre eux par des routes (trajets possibles entre ports).  
  - `(PORT) -[:RELIE_A]-> (PORT)` avec distance.

### Stockage proposé

- **Neo4J (principal)**  
  - Les ports sont des nœuds du graphe avec leurs coordonnées (`point`) et leurs relations :
    - à l’île (`SE_TROUVE_SUR`)
    - aux autres ports (`RELIE_A`)
    - aux lockers (`POSSEDE`)


#### 2.1.3. Locker

### Description
Un locker est une consigne de retrait située dans un port.  
Chaque locker peut contenir au maximum une seule caisse (un colis).  
Il peut être vide ou plein.

### Attributs (minimum)

| Attribut   | Type    | Description 
|------------|---------|-------------
| `id`       | ID      | Identifiant unique 
| `etat`     | Boolean | `true` = plein, `false` = vide 

> Remarque : on ne stocke pas ici la caisse ou la commande → cela sera géré par d’autres entités.

### Relations

- Un locker appartient à **un port**  
  - `(LOCKER) -[:SE_TROUVE_DANS]-> (PORT)`

### Stockage proposé
- **MongoDB** : parfait pour des documents simples comme les lockers (état vide/plein).
- **Neo4J** (optionnel uniquement pour relation avec Port) :  
  Neo4J peut référencer le locker via la relation `(PORT)-[:POSSEDE]->(LOCKER)` si besoin pour les trajets/logistique.

#### 2.1.4. Hydravion

**Description**
Un hydravion est utilisé pour transporter des caisses entre l’entrepôt et les ports des îles.  
Chaque hydravion a une capacité maximale en nombre de caisses et une consommation par kilomètre.

**Attributs**

| Attribut         | Type   | Description 
|------------------|--------|-------------
| `id`             | ID     | Identifiant unique 
| `modele`         | String | Nom ou type de l’hydravion 
| `capacite`       | Int    | Nombre maximum de caisses transportables 
| `consommation`   | Float  | Carburant consommé par km 

**Relations**

- Un hydravion effectue des **livraisons**  
  - `(HYDRAVION) -[:EFFECTUE]-> (LIVRAISON)`

**Stockage proposé**
- **Neo4J** (position, relations trajet)  
- **MongoDB** (infos statiques : modèle, capacité, consommation)

#### 2.1.5. Caisse

**Description**
Une caisse représente une unité physique de livraison.  
Une commande peut contenir plusieurs caisses.  
Chaque caisse peut être positionnée dans un locker ou être transportée par un hydravion.

**Attributs**

| Attribut | Type | Description 
|----------|------|-------------
| `id`     | ID   | Identifiant unique 

**Relations**

- Une caisse appartient à **une commande**  
  - `(CAISSE) -[:APPARTIENT_A]-> (COMMANDE)`
- Une caisse peut être placée dans **un locker**  
  - `(CAISSE) -[:STOCKEE_DANS]-> (LOCKER)`  
- Une caisse peut être transportée par un **hydravion**  
  - `(HYDRAVION) -[:TRANSPORTE]-> (CAISSE)`

**Stockage proposé**
- **MongoDB** (simple document sans attributs complexes)

#### 2.1.6. Produit

**Description**
Un produit représente un matériel scientifique pouvant être commandé par un client.  
Le stock est limité.

**Attributs**

| Attribut   | Type    | Description 
|------------|---------|-------------
| `id`       | ID      | Identifiant unique 
| `nom`      | String  | Nom du produit 
| `stock`    | Int     | Quantité disponible à l’entrepôt 

**Relations**
- Un produit peut apparaître dans une **commande** (via les caisses)

**Stockage proposé**
- **MongoDB** (parfait pour gérer le stock facilement)

#### 2.1.7. Client

**Description**
Un client est un scientifique recevant des produits dans les ports de son île.

**Attributs**

| Attribut | Type   | Description |
|----------|--------|-------------|
| `id`     | ID     | Identifiant unique |
| `nom`    | String | Nom du client |

**Relations**

- Un client passe des **commandes**  
  - `(CLIENT) -[:PASSE]-> (COMMANDE)`

**Stockage proposé**
- **MongoDB** (idéal pour stocker des fiches clients)

#### 2.1.8. Commande

**Description**
Une commande contient un ou plusieurs produits, répartis en une ou plusieurs caisses.  
Elle est associée à un client.

**Attributs**

| Attribut   | Type   | Description |
|------------|--------|-------------|
| `id`       | ID     | Identifiant unique |
| `date`     | Date   | Date de la commande |

**Relations**

- Une commande est passée par un **client**  
  - `(COMMANDE) -[:FAITE_PAR]-> (CLIENT)`
- Une commande contient des **caisses**  
  - `(COMMANDE) -[:CONTIENT]-> (CAISSE)`
- Une commande est livrée via une **livraison**  
  - `(COMMANDE) -[:LIVREE_PAR]-> (LIVRAISON)`

**Stockage proposé**
- **MongoDB** (structure flexible et liée au client)

#### 2.1.9. Livraison

**Description**
Une livraison représente un trajet effectué par un hydravion pour livrer une ou plusieurs caisses dans plusieurs ports.

**Attributs**

| Attribut      | Type | Description |
|---------------|------|-------------|
| `id`          | ID   | Identifiant unique |

**Relations**

- Une livraison est effectuée par **un hydravion**  
  - `(LIVRAISON) -[:EFFECTUE_PAR]-> (HYDRAVION)`
- Une livraison concerne **un ou plusieurs ports**  
  - `(LIVRAISON) -[:LIVRE_A]-> (PORT)`
- Une livraison transporte **des caisses**  
  - `(LIVRAISON) -[:TRANSPORTE]-> (CAISSE)`

**Stockage proposé**
- **Neo4J** : idéal pour suivre les trajets, étapes, enchaînements de ports

### 2.2. Relations entre entités

- ÎLE → PORT : Une île peut posséder plusieurs ports.
- PORT → LOCKER : Un port peut posséder plusieurs lockers.
- PORT → PORT : Des ports peuvent être reliés entre eux par des routes.
- HYDRAVION → LIVRAISON : Un hydravion effectue plusieurs livraisons.
- CAISSE → COMMANDE : Une caisse appartient à une commande.
- CAISSE → LOCKER : Une caisse peut être placée dans un locker.
- CAISSE → HYDRAVION : Une caisse peut être transportée par un hydravion.
- COMMANDE → CLIENT : Une commande est passée par un client.
- COMMANDE → CAISSE : Une commande contient plusieurs caisses.
- COMMANDE → LIVRAISON : Une commande est livrée via une livraison.
- LIVRAISON → HYDRAVION : Une livraison est effectuée par un hydravion.
- LIVRAISON → PORT : Une livraison concerne plusieurs ports.
- LIVRAISON → CAISSE : Une livraison transporte plusieurs caisses.

## 3. Répartition des données entre MongoDB et Neo4J

L’objectif est de séparer les données selon leur usage :

- **Neo4J** : pour les éléments **géographiques** et **relationnels** (trajets, graphes, connexions).
- **MongoDB** : pour les **documents métiers** (clients, commandes, produits, lockers…).

### 3.1 Tableau de répartition

| Entité      | MongoDB | Neo4J | Raison principale |
|------------|---------|-------|-------------------|
| Île        | ❌      | ✅    | Nœud géographique relié aux ports |
| Port       | ❌      | ✅    | Nœud central du graphe de trajets |
| Locker     | ✅      | (optionnel) | État simple (vide/plein) par port |
| Hydravion  | ✅      | ✅    | Données statiques en Mongo, trajets/relations en Neo4J |
| Caisse     | ✅      | (optionnel) | Document simple lié aux commandes/lockers |
| Produit    | ✅      | ❌    | Gestion de stock, catalogue produits |
| Client     | ✅      | ❌    | Fiches clients, historique |
| Commande   | ✅      | ❌    | Commandes client, lien avec produits/caisses |
| Livraison  | ❌      | ✅    | Trajets, séquences de ports, calcul d’itinéraires |

### 3.2 Détails par type de données

- **Neo4J (graphe)**  
  - Îles  
  - Ports  
  - Trajets entre ports (`RELIE_A`)  
  - Livraisons (chemins dans le graphe)  
  - Hydravions (liens avec les livraisons)

- **MongoDB (documents)**  
  - Clients  
  - Produits  
  - Commandes  
  - Caisses  
  - Lockers  
  - Informations statiques sur les hydravions (modèle, capacité, consommation)

Cette séparation permet :
- d’utiliser Neo4J pour les **calculs d’itinéraire, distances, connexions**,
- d’utiliser MongoDB pour la **logique métier** (commande, stock, clients, lockers).

## 4. Diagramme des relations (MCD simplifié)

Le but de ce MCD simplifié est de montrer les principales entités et leurs liens, sans entrer dans tous les détails techniques de MongoDB / Neo4J.

### 4.1 Vue globale (texte)

- Une **Île** possède plusieurs **Ports**  
- Un **Port** possède plusieurs **Lockers**  
- Les **Ports** sont reliés entre eux (trajets possibles)  
- Un **Client** passe plusieurs **Commandes**  
- Une **Commande** est composée de plusieurs **Caisses**  
- Une **Caisse** contient un seul **Produit**  
- Une **Caisse** peut être :
  - dans un **Locker** (en attente de retrait)
  - ou transportée pendant une **Livraison**
- Une **Livraison** est effectuée par un **Hydravion**
- Une **Livraison** peut desservir plusieurs **Ports**
- Une **Livraison** transporte plusieurs **Caisses**

### 4.2 Diagramme textuel (simplifié)

```text
ÎLE (1) ──────────< (N) PORT >────────────(N) RELIE_A (N)────────────< (N) PORT

PORT (1) ─────────< (N) LOCKER

CLIENT (1) ───────< (N) COMMANDE (1) ─────< (N) CAISSE (N) >──────── (1) PRODUIT

CAISSE (N) >────── (0,1) LOCKER

HYDRAVION (1) ────< (N) LIVRAISON (N) >─── (N) PORT
                         |
                         └────(N) CAISSE
```

### 4.3 Relations et cardinalités

- ÎLE (1) ──< (N) PORT : Une île possède plusieurs ports.
- PORT (1) ──< (N) LOCKER : Un port possède plusieurs lockers.
- CLIENT (1) ──< (N) COMMANDE : Un client   passe plusieurs commandes.
- COMMANDE (1) ──< (N) CAISSE : Une commande est composée de plusieurs caisses.
- CAISSE (N) >── (1) PRODUIT : Une caisse contient un seul produit.
- CAISSE (N) >── (0,1) LOCKER : Une caisse peut être dans un locker (ou pas).
- HYDRAVION (1) ──< (N) LIVRAISON : Un hydravion effectue plusieurs livraisons.
- LIVRAISON (N) >── (N) PORT : Une livraison peut desservir plusieurs ports.
- LIVRAISON (N) >── (N) CAISSE : Une livraison transporte plusieurs caisses.    

## 5. Schéma GraphQL (brouillon)

Le schéma GraphQL sert de couche d’accès unique aux données stockées à la fois dans MongoDB et Neo4J.  
Les types suivants reprennent les entités principales de la modélisation.

### 5.1 Types de base

```graphql
type Coordonnees {
  latitude: Float!
  longitude: Float!
}
```
### 5.2 Entités géographiques

```graphql

type Ile {
  id: ID!
  nom: String!
  ports: [Port!]!        # Ports situés sur cette île (Neo4J)
}

type Port {
  id: ID!
  nom: String!
  coordonnees: Coordonnees!
  ile: Ile!              # Île à laquelle appartient le port
  lockers: [Locker!]!    # Lockers présents dans ce port
  portsRelies: [Port!]!  # Autres ports reliés (trajets possibles)
}
```
### 5.3 Lockers et caisses

```graphql

type Locker {
  id: ID!
  etat: Boolean!         # true = plein, false = vide
  port: Port!            # Port dans lequel se trouve le locker
  caisse: Caisse         # Caisse actuellement dans le locker (ou null si vide)
}

type Caisse {
  id: ID!
  commande: Commande!    # Commande à laquelle appartient la caisse
  produit: Produit!      # Produit contenu dans la caisse
  locker: Locker         # Locker actuel (null si en transit)
  livraisons: [Livraison!]! # Livraisons ayant transporté cette caisse
}
```
### 5.4 Produits et clients

```graphql

type Produit {
  id: ID!
  nom: String!
  stock: Int!            # Stock disponible à l’entrepôt
}

type Client {
  id: ID!
  nom: String!
  commandes: [Commande!]!
}
```
### 5.5 Commandes et livraisons
```graphql

type Commande {
  id: ID!
  date: String!          # ISO 8601 (ex: "2025-11-30T10:15:00Z")
  client: Client!
  caisses: [Caisse!]!
  livraisons: [Livraison!]! # Livraisons qui ont pris en charge cette commande
}

type Hydravion {
  id: ID!
  modele: String!
  capacite: Int!         # Nombre max de caisses
  consommation: Float!   # Carburant par km
  livraisons: [Livraison!]!
}

type Livraison {
  id: ID!
  hydravion: Hydravion!
  portsDesservis: [Port!]!   # Ports visités pendant la livraison
  caisses: [Caisse!]!        # Caisses transportées
}
```

### 5.6 Type Query (lecture des données)

```graphql

type Query {
  # Géographie
  iles: [Ile!]!
  ile(id: ID!): Ile

  ports: [Port!]!
  port(id: ID!): Port

  # Lockers / logistique
  lockers: [Locker!]!
  locker(id: ID!): Locker

  # Clients / commandes
  clients: [Client!]!
  client(id: ID!): Client

  commandes: [Commande!]!
  commande(id: ID!): Commande

  # Flotte et livraisons
  hydravions: [Hydravion!]!
  hydravion(id: ID!): Hydravion

  livraisons: [Livraison!]!
  livraison(id: ID!): Livraison
}
```

## 6. Cas d’usage et requêtes GraphQL prioritaires

Cette section liste les requêtes GraphQL les plus importantes pour le projet, en lien avec les besoins métier.

### 6.1 Itinéraire optimal entre ports

**Objectif métier :**  
Proposer un itinéraire optimal pour un hydravion entre un port de départ et un port d’arrivée, en minimisant la distance ou la consommation.

**Requête GraphQL (brouillon) :**
```graphql
query ItineraireOptimal($departId: ID!, $arriveeId: ID!) {
  itineraireOptimal(departId: $departId, arriveeId: $arriveeId) {
    ports {
      id
      nom
    }
    distanceTotale
    consommationTotale
  }
}
```
### 6.2 État des lockers d’un port

**Objectif métier :**
Afficher rapidement les lockers vides/pleins d’un port donné.

**Requête GraphQL (brouillon) :**
```graphql

query EtatLockers($portId: ID!) {
  port(id: $portId) {
    id
    nom
    lockers {
      id
      etat    # true = plein, false = vide
    }
  }
}
```

### 6.3 Historique des commandes d’un client

**Objectif métier :**
Permettre à un client de consulter l’historique de ses commandes passées.

**Requête GraphQL (brouillon) :**
```graphql
query HistoriqueClient($clientId: ID!) {
  client(id: $clientId) {
    id
    nom
    commandes {
      id
      date
      caisses {
        id
        produit {
          id
          nom
        }
      }
    }
  }
}
```