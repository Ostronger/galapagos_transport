
// Connexions Isabela <-> Santa Cruz
MATCH (p1:Port {id:"PORT-001"})
MATCH (p2:Port {id:"PORT-003"})
CREATE (p1)-[:RELIE_A {distance: 85}]->(p2),
       (p2)-[:RELIE_A {distance: 85}]->(p1);

// Connexions Santa Cruz <-> San Cristobal
MATCH (p3:Port {id:"PORT-003"})
MATCH (p4:Port {id:"PORT-005"})
CREATE (p3)-[:RELIE_A {distance: 72}]->(p4),
       (p4)-[:RELIE_A {distance: 72}]->(p3);

// Connexions Isabela <-> Santiago
MATCH (p5:Port {id:"PORT-002"})
MATCH (p6:Port {id:"PORT-009"})
CREATE (p5)-[:RELIE_A {distance: 110}]->(p6),
       (p6)-[:RELIE_A {distance: 110}]->(p5);


// Connexions San Cristobal <-> Floreana
MATCH (p7:Port {id:"PORT-005"})
MATCH (p8:Port {id:"PORT-007"})
CREATE (p7)-[:RELIE_A {distance: 95}]->(p8),
       (p8)-[:RELIE_A {distance: 95}]->(p7);

// Connexions Santa Cruz <-> Floreana
MATCH (p9:Port {id:"PORT-003"})
MATCH (p10:Port {id:"PORT-007"})
CREATE (p9)-[:RELIE_A {distance: 50}]->(p10),
       (p10)-[:RELIE_A {distance: 50}]->(p9);