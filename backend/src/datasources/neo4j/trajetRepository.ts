import type { Driver, Session } from "neo4j-driver";

export type TrajetNeo4j = {
  id: string;
  distanceKm: number | null;
  dureeMinutes: number | null;
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
        const distance =
            rawDistance !== null && rawDistance !== undefined
                ? Number(rawDistance)
                : null;

        return {
          // On génère un id logique à partir des ports
          id: `${p1.properties.id as string}_${p2.properties.id as string}`,
          distanceKm: distance,
          // pas encore de durée dans le graphe
          dureeMinutes: null,
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
   * Trajets entre deux ports précis (par id).
   */
  async findByPorts(
    portDepartId: string,
    portArriveeId: string
  ): Promise<TrajetNeo4j[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (p1:Port {id: $portDepartId})-[t:RELIE_A]->(p2:Port {id: $portArriveeId})
        MATCH (p1)-[:SE_TROUVE_SUR]->(i1:Ile)
        MATCH (p2)-[:SE_TROUVE_SUR]->(i2:Ile)
        RETURN t, p1, p2, i1, i2
        `,
        { portDepartId, portArriveeId }
      );

      return result.records.map((record) => {
        const t = record.get("t");
        const p1 = record.get("p1");
        const p2 = record.get("p2");
        const i1 = record.get("i1");
        const i2 = record.get("i2");

        const rawDistance = t.properties.distance;
            const distance =
            rawDistance !== null && rawDistance !== undefined
                ? Number(rawDistance)
                : null;

        return {
          id: `${p1.properties.id as string}_${p2.properties.id as string}`,
          distanceKm: distance,
          dureeMinutes: null,
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

  async calculerItineraireOptimal(
    positionDepart: string | { latitude: number; longitude: number },
    portsCibles: string[],
    consommationKm: number
  ) {
    const session = this.driver.session();
    try {
      // Utiliser l'algorithme du voyageur de commerce (TSP) simplifié
      // On commence par l'entrepôt (ou position actuelle), on visite tous les ports et on revient

      // 1. Trouver le port de départ (si c'est un ID) ou le plus proche (si GPS)
      let portDepartId: string;
      if (typeof positionDepart === 'string') {
        portDepartId = positionDepart;
      } else {
        // Trouver le port le plus proche de la position GPS
        const nearestPort = await session.run(`
          MATCH (p:Port)
          WITH p, point.distance(
            point({latitude: $lat, longitude: $lon}),
            point({latitude: p.latitude, longitude: p.longitude})
          ) AS distance
          ORDER BY distance ASC
          LIMIT 1
          RETURN p.id as id
        `, { lat: positionDepart.latitude, lon: positionDepart.longitude });

        portDepartId = nearestPort.records[0].get("id");
      }

      // 2. Calculer l'itinéraire optimal avec l'algorithme du plus proche voisin
      const result = await session.run(`
        MATCH (start:Port {id: $portDepartId})
        MATCH (targets:Port) WHERE targets.id IN $portsCibles

        // Calculer tous les chemins possibles
        WITH start, collect(targets) as allTargets

        // Algorithme glouton : toujours choisir le port le plus proche non visité
        CALL {
          WITH start, allTargets
          WITH start, allTargets, start as current, [] as visited, 0.0 as totalDistance

          // Boucle pour visiter tous les ports
          UNWIND range(0, size(allTargets)-1) as step
          WITH current, allTargets, visited, totalDistance
          WHERE size(visited) < size(allTargets)

          // Trouver le port non visité le plus proche
          WITH current, allTargets, visited, totalDistance,
               [target IN allTargets WHERE NOT target IN visited |
                 {port: target,
                  distance: point.distance(
                    point({latitude: current.latitude, longitude: current.longitude}),
                    point({latitude: target.latitude, longitude: target.longitude})
                  ) / 1000.0}
               ] as candidates

          WITH current, allTargets, visited, totalDistance,
               candidates[0] as nearest

          RETURN visited + nearest.port as visited,
                 totalDistance + nearest.distance as totalDistance
        }

        RETURN visited, totalDistance
      `, { portDepartId, portsCibles });

      if (result.records.length === 0) {
        throw new Error("Impossible de calculer l'itinéraire");
      }

      const record = result.records[0];
      const portsOrdonnes = record.get("visited").map((port: any) => ({
        id: port.properties.id,
        nom: port.properties.nom,
        coordonnees: {
          latitude: port.properties.latitude,
          longitude: port.properties.longitude
        }
      }));

      const distanceTotale = record.get("totalDistance");
      const carburantNecessaire = distanceTotale * consommationKm;

      return {
        portsOrdonnes,
        distanceTotale,
        carburantNecessaire
      };

    } catch (error) {
      // Fallback : retourner simplement les ports dans l'ordre donné
      console.error("Erreur lors du calcul d'itinéraire:", error);

      const fallbackResult = await session.run(`
        MATCH (p:Port) WHERE p.id IN $portsCibles
        RETURN p
      `, { portsCibles });

      const ports = fallbackResult.records.map(r => {
        const port = r.get("p").properties;
        return {
          id: port.id,
          nom: port.nom,
          coordonnees: {
            latitude: port.latitude,
            longitude: port.longitude
          }
        };
      });

      return {
        portsOrdonnes: ports,
        distanceTotale: 0,
        carburantNecessaire: 0
      };
    } finally {
      await session.close();
    }
  }
}
