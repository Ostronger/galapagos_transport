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