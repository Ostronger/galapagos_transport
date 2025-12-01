const API_URL = "http://localhost:4000/";

// Petite fonction utilitaire pour appeler GraphQL
async function runQuery(query) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  return response.json();
}

// === Initialisation de la carte Leaflet ===
let map;
let portsLayer;
let trajetsLayer;
let hydravionsLayer;

function initMap() {
  // Centre approximatif des Galapagos
  const center = [-0.9, -90.9];

  map = L.map("map").setView(center, 7);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // couche pour les ports
  portsLayer = L.layerGroup().addTo(map);
  // couche pour les trajets
  trajetsLayer = L.layerGroup().addTo(map);
  // couche pour les hydravions (à venir)
  hydravionsLayer = L.layerGroup().addTo(map);
}

// Appeler initMap quand la page est chargée
document.addEventListener("DOMContentLoaded", () => {
  initMap();
});

// === Health check ===
document.getElementById("checkHealth").addEventListener("click", async () => {
  const result = await runQuery(`query { _health }`);
  document.getElementById("healthResult").textContent = result.data._health;
});

// === Ports ===
document.getElementById("loadPorts").addEventListener("click", async () => {
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
      }
    }
  `);

  // 1) Mise à jour de la liste
  const list = document.getElementById("portsList");
  list.innerHTML = "";

  result.data.ports.forEach((port) => {
    const li = document.createElement("li");
    li.textContent = `${port.id} — ${port.nom} (${port.ile.nom})`;
    list.appendChild(li);
  });

  // 2) Mise à jour des marqueurs sur la carte
  portsLayer.clearLayers();

  result.data.ports.forEach((port) => {
    const lat = port.coordonnees.latitude;
    const lng = port.coordonnees.longitude;

    if (lat != null && lng != null) {
      const marker = L.marker([lat, lng]).bindPopup(
        `<strong>${port.nom}</strong><br/>${port.ile.nom}<br/>(${lat.toFixed(4)}, ${lng.toFixed(4)})`
      );
      portsLayer.addLayer(marker);
    }
  });

  // si on a des ports, recadrer la carte sur eux
  const validPorts = result.data.ports.filter(
    (p) => p.coordonnees.latitude != null && p.coordonnees.longitude != null
  );
  if (validPorts.length > 0) {
    const bounds = L.latLngBounds(
      validPorts.map((p) => [p.coordonnees.latitude, p.coordonnees.longitude])
    );
    map.fitBounds(bounds, { padding: [20, 20] });
  }
});

// === Clients ===
document.getElementById("loadClients").addEventListener("click", async () => {
  const result = await runQuery(`
    query {
      clients {
        id
        nom
      }
    }
  `);

  const list = document.getElementById("clientsList");
  list.innerHTML = "";

  result.data.clients.forEach((client) => {
    const li = document.createElement("li");
    li.textContent = `${client.id} — ${client.nom}`;
    list.appendChild(li);
  });
});

// === Trajets ===
document.getElementById("loadTrajets").addEventListener("click", async () => {
  const result = await runQuery(`
    query {
      trajets {
        id
        distanceKm
        portDepart {
          nom
          coordonnees {
            latitude
            longitude
          }
        }
        portArrivee {
          nom
          coordonnees {
            latitude
            longitude
          }
        }
      }
    }
  `);

  trajetsLayer.clearLayers();

  result.data.trajets.forEach((trajet) => {
    const dep = trajet.portDepart.coordonnees;
    const arr = trajet.portArrivee.coordonnees;

    if (
      dep &&
      arr &&
      dep.latitude != null &&
      dep.longitude != null &&
      arr.latitude != null &&
      arr.longitude != null
    ) {
      const latlngs = [
        [dep.latitude, dep.longitude],
        [arr.latitude, arr.longitude],
      ];

      const line = L.polyline(latlngs).bindPopup(
        `<strong>${trajet.portDepart.nom}</strong> → <strong>${trajet.portArrivee.nom}</strong><br/>Distance : ${
          trajet.distanceKm ?? "?"
        } km`
      );

      trajetsLayer.addLayer(line);
    }
  });
});

// === Hydravions ===
document.getElementById("loadHydravions").addEventListener("click", async () => {
  const result = await runQuery(`
    query {
      hydravions {
        id
        modele
        capacite
        consommation
        etat
        positionPort {
          id
          nom
          coordonnees {
            latitude
            longitude
          }
        }
      }
    }
  `);

  const hydravions = result.data.hydravions;

  // 1) Mise à jour de la liste
  const list = document.getElementById("hydravionsList");
  list.innerHTML = "";

  hydravions.forEach((h) => {
    const li = document.createElement("li");

    const etatAffiche =
      h.etat === "EN_VOL"
        ? "✈️ En vol"
        : h.etat === "AU_PORT"
        ? `🛬 Au port (${h.positionPort?.nom})`
        : h.etat === "EN_MAINTENANCE"
        ? "🛠️ En maintenance"
        : h.etat === "A_L_ENTREPOT"
        ? "📦 À l'entrepôt"
        : h.etat;

    li.textContent = `${h.modele} — Capacité: ${h.capacite} caisses — Conso: ${h.consommation} L/km — État: ${etatAffiche}`;
    list.appendChild(li);
  });

  // 2) Affichage sur la carte
  hydravionsLayer.clearLayers();

  const points = [];

  hydravions.forEach((h) => {
    const pos = h.positionPort;

    if (!pos || !pos.coordonnees) {
      return; // hydravion sans port (en vol, entrepôt, etc.)
    }

    const lat = pos.coordonnees.latitude;
    const lng = pos.coordonnees.longitude;

    if (lat == null || lng == null) {
      return;
    }

    const marker = L.circleMarker([lat, lng], {
        radius: 8,
        color: "green",
        fillColor: "green",
        fillOpacity: 0.8,
    }).bindPopup(
        `<strong>${h.modele}</strong><br/>
        État : ${h.etat}<br/>
        Port : ${pos.nom}<br/>
        (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    );

    hydravionsLayer.addLayer(marker);
    points.push([lat, lng]);
  });

  // 3) Si on a au moins un hydravion placé, on ajuste la vue
  if (points.length > 0) {
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [20, 20] });
  }
});