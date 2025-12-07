// Connexions PORT-000 (Entrepôt Central) <-> PORT-001 (Puerto Ayora)
MATCH (p1:Port {id:"PORT-000"})
MATCH (p2:Port {id:"PORT-001"})
CREATE (p1)-[:RELIE_A {distance: 85.69}]->(p2),
       (p2)-[:RELIE_A {distance: 85.69}]->(p1);

// Connexions PORT-000 (Entrepôt Central) <-> PORT-002 (Puerto Villamil)
MATCH (p1:Port {id:"PORT-000"})
MATCH (p3:Port {id:"PORT-002"})
CREATE (p1)-[:RELIE_A {distance: 155.88}]->(p3),
       (p3)-[:RELIE_A {distance: 155.88}]->(p1);

// Connexions PORT-000 (Entrepôt Central) <-> PORT-003 (Puerto Baquerizo Moreno)
MATCH (p1:Port {id:"PORT-000"})
MATCH (p4:Port {id:"PORT-003"})
CREATE (p1)-[:RELIE_A {distance: 5.91}]->(p4),
       (p4)-[:RELIE_A {distance: 5.91}]->(p1);

// Connexions PORT-000 (Entrepôt Central) <-> PORT-004 (Puerto Velasco Ibarra)
MATCH (p1:Port {id:"PORT-000"})
MATCH (p5:Port {id:"PORT-004"})
CREATE (p1)-[:RELIE_A {distance: 111.2}]->(p5),
       (p5)-[:RELIE_A {distance: 111.2}]->(p1);

// Connexions PORT-000 (Entrepôt Central) <-> PORT-005 (Puerto Chino)
MATCH (p1:Port {id:"PORT-000"})
MATCH (p6:Port {id:"PORT-005"})
CREATE (p1)-[:RELIE_A {distance: 14.46}]->(p6),
       (p6)-[:RELIE_A {distance: 14.46}]->(p1);

// Connexions PORT-001 (Puerto Ayora) <-> PORT-002 (Puerto Villamil)
MATCH (p2:Port {id:"PORT-001"})
MATCH (p3:Port {id:"PORT-002"})
CREATE (p2)-[:RELIE_A {distance: 75.87}]->(p3),
       (p3)-[:RELIE_A {distance: 75.87}]->(p2);

// Connexions PORT-001 (Puerto Ayora) <-> PORT-003 (Puerto Baquerizo Moreno)
MATCH (p2:Port {id:"PORT-001"})
MATCH (p4:Port {id:"PORT-003"})
CREATE (p2)-[:RELIE_A {distance: 79.79}]->(p4),
       (p4)-[:RELIE_A {distance: 79.79}]->(p2);

// Connexions PORT-001 (Puerto Ayora) <-> PORT-004 (Puerto Velasco Ibarra)
MATCH (p2:Port {id:"PORT-001"})
MATCH (p5:Port {id:"PORT-004"})
CREATE (p2)-[:RELIE_A {distance: 61.87}]->(p5),
       (p5)-[:RELIE_A {distance: 61.87}]->(p2);

// Connexions PORT-001 (Puerto Ayora) <-> PORT-005 (Puerto Chino)
MATCH (p2:Port {id:"PORT-001"})
MATCH (p6:Port {id:"PORT-005"})
CREATE (p2)-[:RELIE_A {distance: 100.13}]->(p6),
       (p6)-[:RELIE_A {distance: 100.13}]->(p2);

// Connexions PORT-002 (Puerto Villamil) <-> PORT-003 (Puerto Baquerizo Moreno)
MATCH (p3:Port {id:"PORT-002"})
MATCH (p4:Port {id:"PORT-003"})
CREATE (p3)-[:RELIE_A {distance: 150.07}]->(p4),
       (p4)-[:RELIE_A {distance: 150.07}]->(p3);

// Connexions PORT-002 (Puerto Villamil) <-> PORT-004 (Puerto Velasco Ibarra)
MATCH (p3:Port {id:"PORT-002"})
MATCH (p5:Port {id:"PORT-004"})
CREATE (p3)-[:RELIE_A {distance: 62.71}]->(p5),
       (p5)-[:RELIE_A {distance: 62.71}]->(p3);

// Connexions PORT-002 (Puerto Villamil) <-> PORT-005 (Puerto Chino)
MATCH (p3:Port {id:"PORT-002"})
MATCH (p6:Port {id:"PORT-005"})
CREATE (p3)-[:RELIE_A {distance: 170.13}]->(p6),
       (p6)-[:RELIE_A {distance: 170.13}]->(p3);

// Connexions PORT-003 (Puerto Baquerizo Moreno) <-> PORT-004 (Puerto Velasco Ibarra)
MATCH (p4:Port {id:"PORT-003"})
MATCH (p5:Port {id:"PORT-004"})
CREATE (p4)-[:RELIE_A {distance: 106.12}]->(p5),
       (p5)-[:RELIE_A {distance: 106.12}]->(p4);

// Connexions PORT-003 (Puerto Baquerizo Moreno) <-> PORT-005 (Puerto Chino)
MATCH (p4:Port {id:"PORT-003"})
MATCH (p6:Port {id:"PORT-005"})
CREATE (p4)-[:RELIE_A {distance: 20.38}]->(p6),
       (p6)-[:RELIE_A {distance: 20.38}]->(p4);

// Connexions PORT-004 (Puerto Velasco Ibarra) <-> PORT-005 (Puerto Chino)
MATCH (p5:Port {id:"PORT-004"})
MATCH (p6:Port {id:"PORT-005"})
CREATE (p5)-[:RELIE_A {distance: 123.99}]->(p6),
       (p6)-[:RELIE_A {distance: 123.99}]->(p5);
