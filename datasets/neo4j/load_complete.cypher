// Script de chargement complet pour Neo4j
// Ce script crée les îles, ports et trajets dans le graphe Neo4j

// ========== NETTOYAGE ==========
MATCH (n) DETACH DELETE n;

// ========== CRÉATION DES ÎLES ==========
CREATE (:Ile {id: "ILE-001", nom: "Santa Cruz"});
CREATE (:Ile {id: "ILE-002", nom: "Isabela"});
CREATE (:Ile {id: "ILE-003", nom: "San Cristobal"});
CREATE (:Ile {id: "ILE-004", nom: "Floreana"});
CREATE (:Ile {id: "ILE-005", nom: "Santiago"});
CREATE (:Ile {id: "ILE-006", nom: "Fernandina"});
CREATE (:Ile {id: "ILE-007", nom: "Española"});
CREATE (:Ile {id: "ILE-008", nom: "Genovesa"});

// ========== CRÉATION DES PORTS ==========

// Ports de Santa Cruz (ILE-001)
MATCH (i:Ile {id: "ILE-001"})
CREATE (:Port {id: "PORT-001", nom: "Puerto Ayora", latitude: -0.742, longitude: -90.311})-[:SE_TROUVE_SUR]->(i);

// Ports de Isabela (ILE-002)
MATCH (i:Ile {id: "ILE-002"})
CREATE (:Port {id: "PORT-002", nom: "Puerto Villamil", latitude: -0.955, longitude: -90.966})-[:SE_TROUVE_SUR]->(i);
MATCH (i:Ile {id: "ILE-002"})
CREATE (:Port {id: "PORT-009", nom: "Bahia Elizabeth", latitude: -0.250, longitude: -91.300})-[:SE_TROUVE_SUR]->(i);

// Ports de San Cristobal (ILE-003) - Entrepôt principal
MATCH (i:Ile {id: "ILE-003"})
CREATE (:Port {id: "PORT-005", nom: "Puerto Baquerizo Moreno", latitude: -0.902, longitude: -89.610, isEntrepot: true})-[:SE_TROUVE_SUR]->(i);
MATCH (i:Ile {id: "ILE-003"})
CREATE (:Port {id: "PORT-006", nom: "Cerro Brujo", latitude: -0.800, longitude: -89.450})-[:SE_TROUVE_SUR]->(i);

// Ports de Floreana (ILE-004)
MATCH (i:Ile {id: "ILE-004"})
CREATE (:Port {id: "PORT-007", nom: "Puerto Velasco Ibarra", latitude: -1.256, longitude: -90.487})-[:SE_TROUVE_SUR]->(i);
MATCH (i:Ile {id: "ILE-004"})
CREATE (:Port {id: "PORT-008", nom: "Cormorant Point", latitude: -1.240, longitude: -90.420})-[:SE_TROUVE_SUR]->(i);

// Ports de Santiago (ILE-005)
MATCH (i:Ile {id: "ILE-005"})
CREATE (:Port {id: "PORT-003", nom: "Puerto Egas", latitude: -0.244, longitude: -91.432})-[:SE_TROUVE_SUR]->(i);
MATCH (i:Ile {id: "ILE-005"})
CREATE (:Port {id: "PORT-010", nom: "Cousin Rock", latitude: -0.299, longitude: -91.580})-[:SE_TROUVE_SUR]->(i);

// Ports de Fernandina (ILE-006)
MATCH (i:Ile {id: "ILE-006"})
CREATE (:Port {id: "PORT-011", nom: "Punta Espinoza", latitude: -0.267, longitude: -91.450})-[:SE_TROUVE_SUR]->(i);

// Ports de Española (ILE-007)
MATCH (i:Ile {id: "ILE-007"})
CREATE (:Port {id: "PORT-012", nom: "Punta Suarez", latitude: -1.380, longitude: -89.620})-[:SE_TROUVE_SUR]->(i);

// Ports de Genovesa (ILE-008)
MATCH (i:Ile {id: "ILE-008"})
CREATE (:Port {id: "PORT-004", nom: "Darwin Bay", latitude: 0.320, longitude: -89.960})-[:SE_TROUVE_SUR]->(i);

// ========== CRÉATION DES TRAJETS (RELATIONS RELIE_A) ==========

// Connexions depuis Puerto Baquerizo Moreno (Entrepôt - ILE-003)
MATCH (p1:Port {id: "PORT-005"}), (p2:Port {id: "PORT-001"})
CREATE (p1)-[:RELIE_A {distance: 72}]->(p2), (p2)-[:RELIE_A {distance: 72}]->(p1);

MATCH (p1:Port {id: "PORT-005"}), (p2:Port {id: "PORT-002"})
CREATE (p1)-[:RELIE_A {distance: 145}]->(p2), (p2)-[:RELIE_A {distance: 145}]->(p1);

MATCH (p1:Port {id: "PORT-005"}), (p2:Port {id: "PORT-007"})
CREATE (p1)-[:RELIE_A {distance: 95}]->(p2), (p2)-[:RELIE_A {distance: 95}]->(p1);

MATCH (p1:Port {id: "PORT-005"}), (p2:Port {id: "PORT-012"})
CREATE (p1)-[:RELIE_A {distance: 88}]->(p2), (p2)-[:RELIE_A {distance: 88}]->(p1);

// Connexions Santa Cruz (PORT-001)
MATCH (p1:Port {id: "PORT-001"}), (p2:Port {id: "PORT-002"})
CREATE (p1)-[:RELIE_A {distance: 85}]->(p2), (p2)-[:RELIE_A {distance: 85}]->(p1);

MATCH (p1:Port {id: "PORT-001"}), (p2:Port {id: "PORT-007"})
CREATE (p1)-[:RELIE_A {distance: 50}]->(p2), (p2)-[:RELIE_A {distance: 50}]->(p1);

MATCH (p1:Port {id: "PORT-001"}), (p2:Port {id: "PORT-003"})
CREATE (p1)-[:RELIE_A {distance: 90}]->(p2), (p2)-[:RELIE_A {distance: 90}]->(p1);

MATCH (p1:Port {id: "PORT-001"}), (p2:Port {id: "PORT-004"})
CREATE (p1)-[:RELIE_A {distance: 180}]->(p2), (p2)-[:RELIE_A {distance: 180}]->(p1);

// Connexions Isabela (PORT-002)
MATCH (p1:Port {id: "PORT-002"}), (p2:Port {id: "PORT-009"})
CREATE (p1)-[:RELIE_A {distance: 78}]->(p2), (p2)-[:RELIE_A {distance: 78}]->(p1);

MATCH (p1:Port {id: "PORT-002"}), (p2:Port {id: "PORT-003"})
CREATE (p1)-[:RELIE_A {distance: 95}]->(p2), (p2)-[:RELIE_A {distance: 95}]->(p1);

MATCH (p1:Port {id: "PORT-002"}), (p2:Port {id: "PORT-011"})
CREATE (p1)-[:RELIE_A {distance: 55}]->(p2), (p2)-[:RELIE_A {distance: 55}]->(p1);

// Connexions Santiago (PORT-003)
MATCH (p1:Port {id: "PORT-003"}), (p2:Port {id: "PORT-009"})
CREATE (p1)-[:RELIE_A {distance: 45}]->(p2), (p2)-[:RELIE_A {distance: 45}]->(p1);

MATCH (p1:Port {id: "PORT-003"}), (p2:Port {id: "PORT-010"})
CREATE (p1)-[:RELIE_A {distance: 18}]->(p2), (p2)-[:RELIE_A {distance: 18}]->(p1);

// Connexions Floreana (PORT-007, PORT-008)
MATCH (p1:Port {id: "PORT-007"}), (p2:Port {id: "PORT-008"})
CREATE (p1)-[:RELIE_A {distance: 8}]->(p2), (p2)-[:RELIE_A {distance: 8}]->(p1);

// Connexion Genovesa (PORT-004) - île éloignée
MATCH (p1:Port {id: "PORT-004"}), (p2:Port {id: "PORT-001"})
CREATE (p1)-[:RELIE_A {distance: 180}]->(p2), (p2)-[:RELIE_A {distance: 180}]->(p1);

// ========== VÉRIFICATION ==========
// Compter les nœuds et relations
MATCH (i:Ile) RETURN count(i) as nbIles;
MATCH (p:Port) RETURN count(p) as nbPorts;
MATCH ()-[r:RELIE_A]->() RETURN count(r) as nbTrajets;
