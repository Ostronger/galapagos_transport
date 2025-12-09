const API_URL = "http://localhost:4000/";

// Petite fonction utilitaire pour appeler GraphQL
async function runQuery(query, variables = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
}

// === Initialisation de la carte Leaflet ===
let map;
let portsLayer;
let hydravionsLayer;
let trajetsLayer;

function initMap() {
  // Centre approximatif des Galapagos
  const center = [-0.9, -90.9];

  map = L.map("map").setView(center, 7);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  // couche pour les ports
  portsLayer = L.layerGroup().addTo(map);
  // couche pour les hydravions
  hydravionsLayer = L.layerGroup().addTo(map);
  // couche pour les trajets
  trajetsLayer = L.layerGroup().addTo(map);
}

// Appeler initMap quand la page est chargée
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  loadClientsSelect();
  loadHydravionsSelectOptimisation();
});

// === Health check ===
document.getElementById("checkHealth").addEventListener("click", async () => {
  const result = await runQuery(`query { _health }`);
  document.getElementById("healthResult").textContent =
    "✅ " + result.data._health;
});

// === Carte : Ports et Hydravions ===
document.getElementById("loadMap").addEventListener("click", async () => {
  portsLayer.clearLayers();
  hydravionsLayer.clearLayers();
  trajetsLayer.clearLayers();

  const result = await runQuery(`
    query {
      ports {
        id
        nom
        coordonnees {
          latitude
          longitude
        }
        ile {
          nom
        }
        nbLockersVides
      }
      hydravions {
        id
        modele
        etat
        capaciteActuelle
        capaciteMax
        positionGPS {
          latitude
          longitude
        }
        positionPort {
          id
          nom
        }
      }
    }
  `);

  // Mise à jour des marqueurs ports
  result.data.ports.forEach((port) => {
    const lat = port.coordonnees.latitude;
    const lng = port.coordonnees.longitude;
    const color = port.id === "PORT-000" ? "green" : "blue";

    if (lat != null && lng != null) {
      const marker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl:
            `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      }).bindPopup(
        `<strong>📍 ${port.nom}</strong><br/>
         ${port.ile.nom}<br/>
         Lockers disponibles: ${port.nbLockersVides}<br/>
         (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      );
      portsLayer.addLayer(marker);
    }
  });

  // Mise à jour des marqueurs hydravions
  hydravionsLayer.clearLayers();

  // Fonction helper pour créer le marqueur
  const createHydravionMarker = (hydravion, lat, lng) => {
    const marker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    }).bindPopup(
      `<strong>✈️ ${hydravion.modele}</strong><br/>
       ID: ${hydravion.id}<br/>
       Statut: ${hydravion.etat}<br/>
       Capacité: ${hydravion.capaciteActuelle}/${hydravion.capaciteMax} caisses<br/>
       (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    );
    hydravionsLayer.addLayer(marker);
  };

  // Regrouper les hydravions par port
  const hydravionsByPort = {};
  const hydravionsEnVol = [];

  result.data.hydravions.forEach((hydravion) => {
    if (hydravion.positionPort && hydravion.positionPort.id) {
      const portId = hydravion.positionPort.id;
      if (!hydravionsByPort[portId]) {
        hydravionsByPort[portId] = [];
      }
      hydravionsByPort[portId].push(hydravion);
    } else if (hydravion.positionGPS && hydravion.positionGPS.latitude != null) {
      hydravionsEnVol.push(hydravion);
    }
  });

  // 1. Afficher les hydravions qui sont au port (en cercle autour)
  Object.keys(hydravionsByPort).forEach((portId) => {
    const port = result.data.ports.find((p) => p.id === portId);
    if (!port || !port.coordonnees) return;

    const baseLat = port.coordonnees.latitude;
    const baseLng = port.coordonnees.longitude;
    const planes = hydravionsByPort[portId];
    const count = planes.length;

    // Rayon du cercle autour du port (en degrés). 0.03 est un bon compromis visuel.
    const radius = 0.01;

    planes.forEach((hydravion, index) => {
      // Répartition en cercle
      const angle = (index / count) * 2 * Math.PI;
      // On décale lat/lng
      const lat = baseLat + radius * Math.cos(angle);
      const lng = baseLng + radius * Math.sin(angle);

      console.log(`Hydravion ${hydravion.id} positionné autour du port ${port.nom}`);
      createHydravionMarker(hydravion, lat, lng);
    });
  });

  // 2. Afficher les hydravions en vol
  hydravionsEnVol.forEach((hydravion) => {
    createHydravionMarker(
      hydravion,
      hydravion.positionGPS.latitude,
      hydravion.positionGPS.longitude
    );
  });

  // Recadrer la carte
  const allPoints = result.data.ports
    .map((p) => [p.coordonnees.latitude, p.coordonnees.longitude])
    .filter((p) => p[0] != null && p[1] != null);

  if (allPoints.length > 0) {
    map.fitBounds(L.latLngBounds(allPoints), { padding: [20, 20] });
  }
});

// === Lockers ===
document.getElementById("loadLockers").addEventListener("click", async () => {
  const result = await runQuery(`
    query {
      ports {
        id
        nom
        lockers
        nbLockersVides
      }
    }
  `);

  const list = document.getElementById("lockersList");
  list.innerHTML = "";

  result.data.ports.forEach((port) => {
    if (port.id === "PORT-000") return; // Ignore PORT-000

    const totalLockers = port.lockers.length;
    const lockersVides = port.nbLockersVides;
    const lockersPleins = totalLockers - lockersVides;

    const li = document.createElement("li");
    li.textContent = `${port.nom} — Total: ${totalLockers} | Vides: ${lockersVides} | Pleins: ${lockersPleins}`;
    list.appendChild(li);
  });
});

// === Produits / Stocks ===
document.getElementById("loadProduits").addEventListener("click", async () => {
  const result = await runQuery(`
    query {
      produits {
        id
        nom
        quantiteStocks
      }
    }
  `);

  const list = document.getElementById("produitsList");
  list.innerHTML = "";

  result.data.produits.forEach((produit) => {
    const li = document.createElement("li");
    li.textContent = `${produit.id} — ${produit.nom} | Stock: ${produit.quantiteStocks}`;
    if (produit.quantiteStocks < 5) {
      li.style.borderLeftColor = "red";

    }
    list.appendChild(li);
  });
});
// === Clients ===
document.getElementById("loadClients").addEventListener("click", async () => {
  const result = await runQuery(`
    query {
      clients {
        id
        nom
        historiqueCommandes {
          id
        }
      }
    }
  `);

  const list = document.getElementById("clientsList");
  list.innerHTML = "";

  result.data.clients.forEach((client) => {
    const li = document.createElement("li");
    const nbCommandes = client.historiqueCommandes.length;
    li.textContent = `${client.id} — ${client.nom} | Commandes: ${nbCommandes}`;
    list.appendChild(li);
  });
});

// Charger la liste des clients pour le select
async function loadClientsSelect() {
  const result = await runQuery(`
    query {
      clients {
        id
        nom
      }
    }
  `);

  const select = document.getElementById("clientSelect");
  result.data.clients.forEach((client) => {
    const option = document.createElement("option");
    option.value = client.id;
    option.textContent = `${client.id} — ${client.nom}`;
    select.appendChild(option);
  });
}

// === Historique de livraison ===
document
  .getElementById("loadHistorique")
  .addEventListener("click", async () => {
    const clientId = document.getElementById("clientSelect").value;
    if (!clientId) {
      alert("Veuillez sélectionner un client");
      return;
    }

    const result = await runQuery(
      `
    query($clientId: ID!) {
      toutesLivraisonsClient(clientId: $clientId) {
        id
        dateDepart
        dateArrivee
        statut
        portDepart {
          nom
        }
        portArrivee {
          nom
        }
        hydravion {
          modele
        }
        caisses {
          id
          nom
        }
      }
    }
  `,
      { clientId }
    );

    const list = document.getElementById("historiqueListe");
    list.innerHTML = "";

    if (result.errors) {
      list.innerHTML = `<li style="color: red;">❌ Erreur: ${result.errors[0].message}</li>`;
      return;
    }

    if (result.data.toutesLivraisonsClient.length === 0) {
      list.innerHTML = "<li>Aucune livraison pour ce client</li>";
      return;
    }

    // Séparer les livraisons livrées et en cours
    const livraisons = result.data.toutesLivraisonsClient;
    const livrees = livraisons.filter((l) => l.statut === "LIVREE");
    const enCours = livraisons.filter((l) => l.statut !== "LIVREE");

    // Afficher les livraisons livrées
    if (livrees.length > 0) {
      const titleLivrees = document.createElement("li");
      titleLivrees.style.fontWeight = "bold";
      titleLivrees.style.backgroundColor = "#d4edda";
      titleLivrees.style.padding = "10px";
      titleLivrees.textContent = `✅ Livraisons Livrées (${livrees.length})`;
      list.appendChild(titleLivrees);

      livrees.forEach((livraison) => {
        const li = document.createElement("li");
        const date = livraison.dateArrivee
          ? new Date(livraison.dateArrivee).toLocaleDateString("fr-FR")
          : "—";
        const produits =
          livraison.caisses && livraison.caisses.length > 0
            ? livraison.caisses.map((c) => c.nom).join(", ")
            : "Aucune";
        li.textContent = `${livraison.id} — ${date} | ${livraison.portDepart.nom} → ${livraison.portArrivee.nom} | ${livraison.hydravion.modele} | ${produits}`;
        li.style.borderLeftColor = "green";
        list.appendChild(li);
      });
    }

    // Afficher les livraisons en cours/planifiées
    if (enCours.length > 0) {
      const titleEnCours = document.createElement("li");
      titleEnCours.style.fontWeight = "bold";
      titleEnCours.style.backgroundColor = "#fff3cd";
      titleEnCours.style.padding = "10px";
      titleEnCours.textContent = `🚚 Livraisons En Cours (${enCours.length})`;
      list.appendChild(titleEnCours);

      enCours.forEach((livraison) => {
        const li = document.createElement("li");
        const dateDepart = livraison.dateDepart
          ? new Date(livraison.dateDepart).toLocaleDateString("fr-FR")
          : "À définir";
        const produits =
          livraison.caisses && livraison.caisses.length > 0
            ? livraison.caisses.map((c) => c.nom).join(", ")
            : "Aucune";
        li.textContent = `${livraison.id} — Départ: ${dateDepart} | ${livraison.portDepart.nom} → ${livraison.portArrivee.nom} | ${livraison.hydravion.modele} | Statut: ${livraison.statut} | ${produits}`;
        li.style.borderLeftColor = "orange";
        list.appendChild(li);
      });
    }
  });

// === Hydravions ===
document
  .getElementById("loadHydravions")
  .addEventListener("click", async () => {
    const result = await runQuery(`
    query {
     hydravions {
       id
       modele
       etat
       capaciteMax
       capaciteActuelle
       caisses
       positionPort {
        id
        nom
       }
      }
    }
  `);
    const list = document.getElementById("hydravionsList");
    list.innerHTML = "";

    result.data.hydravions.forEach((hydravion) => {
      const li = document.createElement("li");
      let capaciteText = "";
      if (hydravion.positionPort.id !== "PORT-000") {
        capaciteText = ` | Capacité: ${hydravion.capaciteActuelle}/${hydravion.capaciteMax} caisses`;
      }
      li.textContent = `${hydravion.id} — ${hydravion.modele} | Statut: ${hydravion.etat} | Position: ${hydravion.positionPort ? hydravion.positionPort.nom : "—"}${capaciteText}`;
      list.appendChild(li);
    });
  });

// === Optimisation: Charger les hydravions dans le select ===
async function loadHydravionsSelectOptimisation() {
  const result = await runQuery(`
    query {
      hydravions {
        id
        modele
        etat
        capaciteMax
        niveauCarburant
        niveauCarburantMax
        consommationKm
      }
    }
  `);

  const select = document.getElementById("hydravionSelect");

  result.data.hydravions.forEach((hydravion) => {
    const option = document.createElement("option");
    option.value = hydravion.id;
    option.textContent = `${hydravion.id} — ${hydravion.modele} (${hydravion.etat}) - Capacité: ${hydravion.capaciteMax} caisses`;
    option.dataset.consommation = hydravion.consommationKm;
    select.appendChild(option);
  });

  // Écouter le changement de sélection
  select.addEventListener("change", onHydravionSelected);
}

// Données globales pour les livraisons et ports
let livraisonsData = [];
let portsData = [];
let trajetsData = []; // Distances entre ports depuis Neo4j

// Charger les données des livraisons, ports et trajets depuis GraphQL
async function loadLivraisonsAndPorts() {
  const result = await runQuery(`
    query {
      livraisons {
        id
        statut
        hydravion {
          id
        }
        portDepart {
          id
          nom
          coordonnees {
            latitude
            longitude
          }
        }
        portArrivee {
          id
          nom
          coordonnees {
            latitude
            longitude
          }
        }
        commande {
          client {
            nom
          }
          caisses {
            id
          }
        }
      }
      ports {
        id
        nom
        coordonnees {
          latitude
          longitude
        }
      }
      trajets {
        portDepart
        portArrivee
        distanceKm
      }
    }
  `);

  livraisonsData = result.data.livraisons;
  portsData = result.data.ports;
  trajetsData = result.data.trajets || [];

  console.log("Trajets chargés:", trajetsData);
  console.log("Ports chargés:", portsData.map(p => p.id));
}

// Quand un hydravion est sélectionné
async function onHydravionSelected() {
  const hydravionId = document.getElementById("hydravionSelect").value;
  const container = document.getElementById("livraisonsHydravionContainer");
  const listDiv = document.getElementById("livraisonsHydravionList");
  const resultDiv = document.getElementById("itineraireResult");

  resultDiv.innerHTML = "";

  if (!hydravionId) {
    container.style.display = "none";
    return;
  }

  // Charger les livraisons si pas encore fait
  if (livraisonsData.length === 0) {
    await loadLivraisonsAndPorts();
  }

  // Filtrer les livraisons pour cet hydravion
  const livraisonsHydravion = livraisonsData.filter(
    (l) => l.hydravion && l.hydravion.id === hydravionId
  );

  listDiv.innerHTML = "";

  if (livraisonsHydravion.length === 0) {
    listDiv.innerHTML = "<p class='no-data'>Aucune livraison pour cet hydravion</p>";
    container.style.display = "block";
    return;
  }

  // Afficher les livraisons
  livraisonsHydravion.forEach((livraison) => {
    const div = document.createElement("div");
    div.className = `livraison-item livraison-${livraison.statut.toLowerCase()}`;

    const nbCaisses = livraison.commande?.caisses?.length || 0;
    const clientNom = livraison.commande?.client?.nom || "—";
    const statutIcon = getStatutIcon(livraison.statut);

    div.innerHTML = `
      <div class="livraison-header">
        <span class="livraison-id">${livraison.id}</span>
        <span class="livraison-statut">${statutIcon} ${livraison.statut}</span>
      </div>
      <div class="livraison-details">
        <span>👤 ${clientNom}</span>
        <span>📍 ${livraison.portDepart.nom} → ${livraison.portArrivee.nom}</span>
        <span>📦 ${nbCaisses} caisse(s)</span>
      </div>
    `;

    listDiv.appendChild(div);
  });

  container.style.display = "block";
}

// Obtenir l'icône selon le statut
function getStatutIcon(statut) {
  switch (statut) {
    case "LIVREE": return "✅";
    case "EN_COURS": return "🚚";
    case "PLANIFIEE": return "📋";
    default: return "❓";
  }
}

// Obtenir la distance entre deux ports depuis les données Neo4j (trajetsData)
function getDistanceEntrePortsNeo4j(portId1, portId2) {
  // Si les IDs sont identiques, distance = 0
  if (portId1 === portId2) return 0;

  // Chercher la relation dans les deux sens
  // Gérer le cas où portDepart/portArrivee sont des strings ou des objets
  const trajet = trajetsData.find((t) => {
    const depart = typeof t.portDepart === 'string' ? t.portDepart : t.portDepart?.id;
    const arrivee = typeof t.portArrivee === 'string' ? t.portArrivee : t.portArrivee?.id;
    return (depart === portId1 && arrivee === portId2) ||
      (depart === portId2 && arrivee === portId1);
  });

  if (trajet) {
    console.log(`Distance ${portId1} -> ${portId2}: ${trajet.distanceKm}`);
    return trajet.distanceKm;
  }

  console.warn(`Pas de trajet trouvé entre ${portId1} et ${portId2}`);
  // Retourner une distance très grande au lieu de Infinity pour que l'algo continue
  return 9999;
}

// Algorithme du plus proche voisin pour le TSP utilisant les distances Neo4j
function calculerItineraireOptimalTSP(portDepart, portsCibles) {
  if (portsCibles.length === 0) return { ordre: [portDepart], distance: 0 };

  const visites = [portDepart];
  const nonVisites = [...portsCibles];
  let distanceTotale = 0;
  let currentPort = portDepart;

  while (nonVisites.length > 0) {
    let plusProche = null;
    let distanceMin = Infinity;
    let indexMin = -1;

    nonVisites.forEach((port, index) => {
      // Utiliser les distances Neo4j au lieu de Haversine
      const distance = getDistanceEntrePortsNeo4j(currentPort.id, port.id);
      if (distance < distanceMin) {
        distanceMin = distance;
        plusProche = port;
        indexMin = index;
      }
    });

    // Si aucun port n'a été trouvé (trajectData vide ou IDs invalides)
    // utiliser le premier port non visité
    if (plusProche === null) {
      plusProche = nonVisites[0];
      indexMin = 0;
      distanceMin = getDistanceEntrePortsNeo4j(currentPort.id, plusProche.id);
    }

    visites.push(plusProche);
    distanceTotale += distanceMin;
    currentPort = plusProche;
    nonVisites.splice(indexMin, 1);
  }

  // Retour à l'entrepôt - utiliser les distances Neo4j
  const distanceRetour = getDistanceEntrePortsNeo4j(currentPort.id, portDepart.id);
  distanceTotale += distanceRetour;
  visites.push(portDepart);

  return { ordre: visites, distance: distanceTotale };
}

// Calculer l'itinéraire optimal au clic du bouton
document.getElementById("calculerItineraireBtn").addEventListener("click", async () => {
  const hydravionId = document.getElementById("hydravionSelect").value;
  const resultDiv = document.getElementById("itineraireResult");

  if (!hydravionId) {
    alert("Veuillez sélectionner un hydravion");
    return;
  }

  // Charger les données si pas encore chargées
  if (trajetsData.length === 0) {
    await loadLivraisonsAndPorts();
  }

  // Récupérer la consommation de l'hydravion
  const selectOption = document.getElementById("hydravionSelect").selectedOptions[0];
  const consommationKm = parseFloat(selectOption.dataset.consommation) || 4.0;

  // Filtrer les livraisons de cet hydravion
  const livraisonsHydravion = livraisonsData.filter(
    (l) => l.hydravion && l.hydravion.id === hydravionId
  );

  if (livraisonsHydravion.length === 0) {
    resultDiv.innerHTML = "<p class='error'>❌ Aucune livraison pour cet hydravion</p>";
    return;
  }

  // Récupérer l'entrepôt (PORT-000)
  const entrepot = portsData.find((p) => p.id === "PORT-000");
  if (!entrepot) {
    resultDiv.innerHTML = "<p class='error'>❌ Entrepôt non trouvé</p>";
    return;
  }

  // Extraire les ports d'arrivée uniques
  const portsArriveeIds = [...new Set(livraisonsHydravion.map((l) => l.portArrivee.id))];
  const portsCibles = portsArriveeIds
    .map((id) => portsData.find((p) => p.id === id))
    .filter((p) => p && p.id !== "PORT-000");

  if (portsCibles.length === 0) {
    resultDiv.innerHTML = "<p class='error'>❌ Aucun port de destination trouvé</p>";
    return;
  }

  // Vérifier si trajetsData est chargé
  if (trajetsData.length === 0) {
    resultDiv.innerHTML = "<p class='error'>⚠️ Les données des trajets ne sont pas chargées. Vérifiez que le backend GraphQL retourne les trajets.</p>";
    return;
  }

  // Calculer l'itinéraire optimal
  const resultat = calculerItineraireOptimalTSP(entrepot, portsCibles);
  const consommationTotale = resultat.distance * consommationKm;

  // Afficher les résultats
  const ordreNoms = resultat.ordre.map((p) => p.nom).join(" → ");

  resultDiv.innerHTML = `
    <h3>✅ Itinéraire Optimal Calculé</h3>
    <div class="result-section">
      <p><strong>🗺️ Ordre de visite :</strong></p>
      <div class="itineraire-ordre">${ordreNoms}</div>
    </div>
    <div class="result-stats">
      <div class="stat-item">
        <span class="stat-label">📏 Distance totale</span>
        <span class="stat-value">${resultat.distance.toFixed(2)} km</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">⛽ Consommation carburant</span>
        <span class="stat-value">${consommationTotale.toFixed(2)} litres</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">📦 Nombre de livraisons</span>
        <span class="stat-value">${livraisonsHydravion.length}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">🛬 Ports à visiter</span>
        <span class="stat-value">${portsCibles.length}</span>
      </div>
    </div>
    <div class="result-section">
      <p><strong>📋 Détail des étapes :</strong></p>
      <ol class="etapes-list">
        ${resultat.ordre.map((port, index) => {
    if (index === 0) {
      return `<li class="etape-depart">🏭 <strong>Départ :</strong> ${port.nom}</li>`;
    } else if (index === resultat.ordre.length - 1) {
      return `<li class="etape-retour">🏭 <strong>Retour :</strong> ${port.nom}</li>`;
    } else {
      const livraisonsPort = livraisonsHydravion.filter((l) => l.portArrivee.id === port.id);
      const clients = livraisonsPort.map((l) => l.commande?.client?.nom || "—").join(", ");
      return `<li class="etape-livraison">📍 <strong>${port.nom}</strong> — ${livraisonsPort.length} livraison(s) (${clients})</li>`;
    }
  }).join("")}
      </ol>
    </div>
  `;

  // Afficher l'itinéraire sur la carte
  afficherItineraireSurCarte(resultat.ordre);
});

// Fonction pour afficher l'itinéraire sur la carte
function afficherItineraireSurCarte(portsOrdonnes) {
  // Nettoyer les couches
  portsLayer.clearLayers();
  trajetsLayer.clearLayers();
  hydravionsLayer.clearLayers();

  const coordinates = portsOrdonnes.map((p) => [
    p.coordonnees.latitude,
    p.coordonnees.longitude,
  ]);

  // Dessiner les marqueurs
  portsOrdonnes.forEach((port, index) => {
    const iconColor =
      port.id === "PORT-000"
        ? "green"
        : index === portsOrdonnes.length - 1
          ? "green"
          : "red";

    const marker = L.marker([
      port.coordonnees.latitude,
      port.coordonnees.longitude,
    ], {
      icon: L.icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${iconColor}.png`,
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    }).bindPopup(`<strong>${index + 1}. ${port.nom}</strong>`);
    portsLayer.addLayer(marker);
  });

  // Dessiner la ligne de l'itinéraire
  const polyline = L.polyline(coordinates, {
    color: "#e74c3c",
    weight: 3,
    opacity: 0.8,
    dashArray: "10, 5",
  });
  trajetsLayer.addLayer(polyline);

  map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
}
