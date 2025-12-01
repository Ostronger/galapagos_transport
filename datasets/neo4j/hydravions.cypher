// Nettoyage des hydravions existants (pour rejouer le script facilement)
MATCH (h:Hydravion)
DETACH DELETE h;

// === Création des hydravions dans Neo4J ===
// On ne met ici que : id + etat
// Les infos statiques (modele, capacite, consommation) viennent de MongoDB (collection hydravions)

// HYD-001 : au port de Puerto Ayora (PORT-003)
MATCH (p_ayora:Port {id:"PORT-003"})
CREATE (h1:Hydravion {id:"HYD-001", etat:"AU_PORT"})
CREATE (h1)-[:EST_AU_PORT]->(p_ayora);

// HYD-002 : au port de Puerto Baquerizo (PORT-005)
MATCH (p_baquerizo:Port {id:"PORT-005"})
CREATE (h2:Hydravion {id:"HYD-002", etat:"AU_PORT"})
CREATE (h2)-[:EST_AU_PORT]->(p_baquerizo);

// HYD-003 : en vol (pas de port associé)
CREATE (h3:Hydravion {id:"HYD-003", etat:"EN_VOL"});

// HYD-004 : en maintenance à Puerto Villamil (PORT-001)
MATCH (p_villamil:Port {id:"PORT-001"})
CREATE (h4:Hydravion {id:"HYD-004", etat:"EN_MAINTENANCE"})
CREATE (h4)-[:EST_AU_PORT]->(p_villamil);

// HYD-005 : à l'entrepôt (pas encore affecté à un port)
CREATE (h5:Hydravion {id:"HYD-005", etat:"A_L_ENTREPOT"});