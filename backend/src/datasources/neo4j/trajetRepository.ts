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
}
