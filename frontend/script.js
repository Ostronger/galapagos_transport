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
});

// === Health check ===
document.getElementById("checkHealth").addEventListener("click", async () => {
  const result = await runQuery(`query { _health }`);
  document.getElementById("healthResult").textContent =
    "✅ " + result.data._health;
});

// === Carte : Ports et Hydravions ===
document.getElementById("loadMap").addEventListener("click", async () => {
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
          nom
        }
      }
    }
  `);

  // Mise à jour des marqueurs ports
  portsLayer.clearLayers();
  result.data.ports.forEach((port) => {
    const lat = port.coordonnees.latitude;
    const lng = port.coordonnees.longitude;

    if (lat != null && lng != null) {
      const marker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
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
  result.data.hydravions.forEach((hydravion) => {
    let lat, lng;

    // Utiliser positionGPS en priorité, sinon positionPort
    if (hydravion.positionGPS && hydravion.positionGPS.latitude != null) {
      lat = hydravion.positionGPS.latitude;
      lng = hydravion.positionGPS.longitude;
    } else if (hydravion.positionPort) {
      // Si l'hydravion est au port, on ne l'affiche pas (évite la superposition)
      return;
    } else {
      return;
    }

    if (lat != null && lng != null) {
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
         Capacité: ${hydravion.capaciteActuelle}/${hydravion.capaciteMax
        } caisses<br/>
         (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      );
      hydravionsLayer.addLayer(marker);
    }
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

// Charger la liste des hydravions pour le select
async function loadHydravionsSelect() {
  const result = await runQuery(`
    query {
      hydravions {
        id
        modele
        etat
      }
    }
  `);

  const select = document.getElementById("hydravionSelect");
  result.data.hydravions.forEach((hydravion) => {
    const option = document.createElement("option");
    option.value = hydravion.id;
    option.textContent = `${hydravion.id} — ${hydravion.modele} (${hydravion.etat})`;
    select.appendChild(option);
  });
}

// === Optimisation d'itinéraire ===
document
  .getElementById("optimiserItineraire")
  .addEventListener("click", async () => {
    const portsInput = document.getElementById("portsInput").value.trim();
    const hydravionId = document.getElementById("hydravionSelect").value;

    if (!portsInput || !hydravionId) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    const portsCibles = portsInput.split(",").map((p) => p.trim());

    const result = await runQuery(
      `
    query($portsCibles: [ID!]!, $hydravionId: ID!) {
      calculerItineraireOptimal(portsCibles: $portsCibles, hydravionId: $hydravionId) {
        portsOrdonnes {
          nom
          coordonnees {
            latitude
            longitude
          }
        }
        distanceTotale
        carburantNecessaire
      }
    }
  `,
      { portsCibles, hydravionId }
    );

    const div = document.getElementById("itineraireResult");

    if (result.errors) {
      div.innerHTML = `<p style="color: red;">❌ Erreur: ${result.errors[0].message}</p>`;
      return;
    }

    const itineraire = result.data.calculerItineraireOptimal;

    const ordre = itineraire.portsOrdonnes.map((p) => p.nom).join(" → ");

    div.innerHTML = `
    <h3>✅ Itinéraire Optimal Calculé</h3>
    <p><strong>Ordre de visite:</strong> ${ordre}</p>
    <p><strong>Distance totale:</strong> ${itineraire.distanceTotale.toFixed(
      2
    )} km</p>
    <p><strong>Consommation carburant:</strong> ${itineraire.carburantNecessaire.toFixed(
      2
    )} litres</p>
  `;

    // Afficher l'itinéraire sur la carte
    portsLayer.clearLayers();

    const coordinates = itineraire.portsOrdonnes.map((p) => [
      p.coordonnees.latitude,
      p.coordonnees.longitude,
    ]);

    // Dessiner les marqueurs
    itineraire.portsOrdonnes.forEach((port, index) => {
      const marker = L.marker([
        port.coordonnees.latitude,
        port.coordonnees.longitude,
      ]).bindPopup(`<strong>${index + 1}. ${port.nom}</strong>`);
      portsLayer.addLayer(marker);
    });

    // Dessiner la ligne de l'itinéraire
    const polyline = L.polyline(coordinates, { color: "red", weight: 3 }).addTo(
      map
    );
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
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
