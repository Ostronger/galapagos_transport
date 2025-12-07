import type { Driver, Session } from "neo4j-driver";

export type TrajetNeo4j = {
  id: string;
  distanceKm: number | null;
  portDepart: {
    id: string;
    nom: string;
    coordonnees: {
      latitude: number | null;
      longitude: number | null;
    };
    ile: {
      id: string;
      nom: string;
    };
  };
  portArrivee: {
    id: string;
    nom: string;
    coordonnees: {
      latitude: number | null;
      longitude: number | null;
    };
    ile: {
      id: string;
      nom: string;
    };
  };
};

export class TrajetRepository {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Retourne tous les trajets du graphe.
   * Relation :RELIE_A avec propriété {distance}.
   */
  async findAll(): Promise<TrajetNeo4j[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (p1:Port)-[t:RELIE_A]->(p2:Port)
        MATCH (p1)-[:SE_TROUVE_SUR]->(i1:Ile)
        MATCH (p2)-[:SE_TROUVE_SUR]->(i2:Ile)
        RETURN t, p1, p2, i1, i2
        `
      );

      return result.records.map((record) => {
        const t = record.get("t");
        const p1 = record.get("p1");
        const p2 = record.get("p2");
        const i1 = record.get("i1");
        const i2 = record.get("i2");

        const rawDistance = t.properties.distance;
        const distance = rawDistance !== null ? Number(rawDistance) : null;

        return {
          // On génère un id logique à partir des ports
          id: `${p1.properties.id as string}_${p2.properties.id as string}`,
          distanceKm: distance,
          portDepart: {
            id: p1.properties.id as string,
            nom: p1.properties.nom as string,
            coordonnees: {
              latitude: (p1.properties.latitude as number) ?? null,
              longitude: (p1.properties.longitude as number) ?? null,
            },
            ile: {
              id: i1.properties.id as string,
              nom: i1.properties.nom as string,
            },
          },
          portArrivee: {
            id: p2.properties.id as string,
            nom: p2.properties.nom as string,
            coordonnees: {
              latitude: (p2.properties.latitude as number) ?? null,
              longitude: (p2.properties.longitude as number) ?? null,
            },
            ile: {
              id: i2.properties.id as string,
              nom: i2.properties.nom as string,
            },
          },
        };
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Calcule l'itinéraire optimal pour visiter une liste de ports
   * en partant de l'entrepôt (PORT-000) et en y retournant.
   * Utilise un algorithme glouton du plus proche voisin.
   */
  async calculerItineraireOptimal(portsCibles: string[]): Promise<{
    portsOrdonnes: Array<{
      id: string;
      nom: string;
      coordonnees: { latitude: number; longitude: number };
    }>;
    distanceTotale: number;
    trajets: Array<{ depart: string; arrivee: string; distance: number }>;
  }> {
    const session = this.driver.session();
    try {
      // Récupérer tous les ports concernés (entrepôt + cibles)
      const portIds = ["PORT-000", ...portsCibles];

      const portsResult = await session.run(
        `
        MATCH (p:Port)
        WHERE p.id IN $portIds
        RETURN p
        `,
        { portIds }
      );

      const ports = portsResult.records.map((record) => {
        const p = record.get("p");
        return {
          id: p.properties.id as string,
          nom: p.properties.nom as string,
          coordonnees: {
            latitude: (p.properties.latitude as number) ?? 0,
            longitude: (p.properties.longitude as number) ?? 0,
          },
        };
      });

      console.log(
        `Ports trouvés pour l'itinéraire:`,
        ports.map((p) => p.id)
      );
      console.log(`Ports demandés:`, portIds);

      // Récupérer toutes les distances entre les ports
      const distancesResult = await session.run(
        `
        MATCH (p1:Port)-[t:RELIE_A]->(p2:Port)
        WHERE p1.id IN $portIds AND p2.id IN $portIds
        RETURN p1.id as depart, p2.id as arrivee, t.distance as distance
        `,
        { portIds }
      );

      // Créer une matrice de distances
      const distanceMap = new Map<string, number>();
      distancesResult.records.forEach((record) => {
        const depart = record.get("depart") as string;
        const arrivee = record.get("arrivee") as string;
        const distance = Number(record.get("distance")) || 0;
        distanceMap.set(`${depart}-${arrivee}`, distance);
      });

      console.log(`Distances trouvées: ${distanceMap.size} trajets`);
      console.log(
        `Exemple de distances:`,
        Array.from(distanceMap.entries()).slice(0, 5)
      );

      // Si aucune distance n'est trouvée dans Neo4j, calculer avec Haversine

      // Algorithme du plus proche voisin (Nearest Neighbor)
      const visited = new Set<string>();
      const itineraire: string[] = [];
      const trajets: Array<{
        depart: string;
        arrivee: string;
        distance: number;
      }> = [];

      let current = "PORT-000"; // Commencer à l'entrepôt
      itineraire.push(current);
      visited.add(current);

      let distanceTotale = 0;

      // Visiter tous les ports cibles
      while (visited.size < portIds.length) {
        let meilleurProchain: string | null = null;
        let meilleureDistance = Infinity;

        // Trouver le port non visité le plus proche
        for (const port of portIds) {
          if (!visited.has(port)) {
            const distance = distanceMap.get(`${current}-${port}`) ?? Infinity;
            if (distance < meilleureDistance) {
              meilleureDistance = distance;
              meilleurProchain = port;
            }
          }
        }

        if (meilleurProchain) {
          trajets.push({
            depart: current,
            arrivee: meilleurProchain,
            distance: meilleureDistance,
          });
          distanceTotale += meilleureDistance;
          current = meilleurProchain;
          itineraire.push(current);
          visited.add(current);
        } else {
          break;
        }
      }

      // Retourner à l'entrepôt
      const distanceRetour = distanceMap.get(`${current}-PORT-000`) ?? Infinity;

      trajets.push({
        depart: current,
        arrivee: "PORT-000",
        distance: distanceRetour,
      });
      distanceTotale += distanceRetour;
      itineraire.push("PORT-000");

      // Récupérer les informations complètes des ports dans l'ordre
      const portsOrdonnes = itineraire.map((portId) => {
        const port = ports.find((p) => p.id === portId);
        return port!;
      });

      return {
        portsOrdonnes,
        distanceTotale,
        trajets,
      };
    } finally {
      await session.close();
    }
  }
}
