// Entrepôt Central
MATCH (i:Ile {id: "ILE-003"})
CREATE (:Port {id: "PORT-000", nom: "Entrepôt Central", latitude: -0.90797, longitude: -89.55816})-[:SE_TROUVE_SUR]->(i);

// Ports de Santa Cruz
MATCH (i:Ile {id: "ILE-001"})
CREATE (:Port {id: "PORT-001", nom: "Puerto Ayora", latitude: -0.74677, longitude: -90.31186})-[:SE_TROUVE_SUR]->(i);

// Ports de Isabela
MATCH (i:Ile {id: "ILE-002"})
CREATE (:Port {id: "PORT-002", nom: "Puerto Villamil", latitude: -0.9628, longitude: -90.95914})-[:SE_TROUVE_SUR]->(i);

// Ports de San Cristobal
MATCH (i:Ile {id: "ILE-003"})
CREATE (:Port {id: "PORT-003", nom: "Puerto Baquerizo Moreno", latitude: -0.90013, longitude: -89.61077})-[:SE_TROUVE_SUR]->(i);

// Ports de Floreana
MATCH (i:Ile {id: "ILE-004"})
CREATE (:Port {id: "PORT-004", nom: "Puerto Velasco Ibarra", latitude: -1.27429, longitude: -90.48887})-[:SE_TROUVE_SUR]->(i);

// Puerto Chino
MATCH (i:Ile {id: "ILE-003"})
CREATE (:Port {id: "PORT-005", nom: "Puerto Chino", latitude: -0.92617, longitude: -89.42935})-[:SE_TROUVE_SUR]->(i);
