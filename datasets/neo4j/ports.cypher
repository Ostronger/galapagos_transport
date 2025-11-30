// Ports de Isabela
MATCH (i:Ile {id: "ILE-001"})
CREATE (:Port {id: "PORT-001", nom: "Puerto Villamil", latitude: -0.955, longitude: -90.966})-[:SE_TROUVE_SUR]->(i);
CREATE (:Port {id: "PORT-002", nom: "Bahia Elizabeth", latitude: -0.250, longitude: -91.300})-[:SE_TROUVE_SUR]->(i);

// Ports de Santa Cruz
MATCH (i:Ile {id: "ILE-002"})
CREATE (:Port {id: "PORT-003", nom: "Puerto Ayora", latitude: -0.742, longitude: -90.311})-[:SE_TROUVE_SUR]->(i);
CREATE (:Port {id: "PORT-004", nom: "Baltra", latitude: -0.463, longitude: -90.273})-[:SE_TROUVE_SUR]->(i);

// Ports de San Cristobal
MATCH (i:Ile {id: "ILE-003"})
CREATE (:Port {id: "PORT-005", nom: "Puerto Baquerizo", latitude: -0.902, longitude: -89.610})-[:SE_TROUVE_SUR]->(i);
CREATE (:Port {id: "PORT-006", nom: "Cerro Brujo", latitude: -0.800, longitude: -89.450})-[:SE_TROUVE_SUR]->(i);

// Ports de Floreana
MATCH (i:Ile {id: "ILE-004"})
CREATE (:Port {id: "PORT-007", nom: "Puerto Velasco Ibarra", latitude: -1.256, longitude: -90.487})-[:SE_TROUVE_SUR]->(i);
CREATE (:Port {id: "PORT-008", nom: "Cormorant Point", latitude: -1.240, longitude: -90.420})-[:SE_TROUVE_SUR]->(i);

// Ports de Santiago
MATCH (i:Ile {id: "ILE-005"})
CREATE (:Port {id: "PORT-009", nom: "Puerto Egas", latitude: -0.244, longitude: -91.432})-[:SE_TROUVE_SUR]->(i);
CREATE (:Port {id: "PORT-010", nom: "Cousin Rock", latitude: -0.299, longitude: -91.580})-[:SE_TROUVE_SUR]->(i);