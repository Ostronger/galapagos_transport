import type { Driver, Session } from "neo4j-driver";

export type HydravionPosition = {
  id: string;
  etat: string;
  positionPort: {
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
  } | null;
};

export class HydravionNeo4jRepository {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Retourne l'état et le port éventuel de tous les hydravions.
   * Les infos "techniques" viennent de Mongo, ici on ne gère que le graphe.
   */
  async findAllStatusWithPort(): Promise<HydravionPosition[]> {
    const session = this.driver.session();

    try {
      const result = await session.run(
        `
        MATCH (h:Hydravion)
        OPTIONAL MATCH (h)-[:EST_AU_PORT]->(p:Port)
        OPTIONAL MATCH (p)-[:SE_TROUVE_SUR]->(i:Ile)
        RETURN h, p, i
        `
      );

      return result.records.map((record) => {
        const h = record.get("h");
        const p = record.get("p");
        const i = record.get("i");

        const etat = h.properties.etat as string;

        if (!p) {
          // pas de port associé (en vol, entrepôt...)
          return {
            id: h.properties.id as string,
            etat,
            positionPort: null,
          };
        }

        return {
          id: h.properties.id as string,
          etat,
          positionPort: {
            id: p.properties.id as string,
            nom: p.properties.nom as string,
            coordonnees: {
              latitude: (p.properties.latitude as number) ?? null,
              longitude: (p.properties.longitude as number) ?? null,
            },
            ile: {
              id: i?.properties.id as string,
              nom: i?.properties.nom as string,
            },
          },
        };
      });
    } finally {
      await session.close();
    }
  }

  // Méthodes pour gérer les relations spatiales des hydravions dans Neo4j
  // Par exemple, pour trouver les ports à proximité d'un hydravion
  async findPortsProches(hydravionId: string, rayonKm: number = 100) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (h:Hydravion {id: $hydravionId})
        MATCH (p:Port)
        WITH h, p, point.distance(
          point({latitude: h.latitude, longitude: h.longitude}),
          point({latitude: p.latitude, longitude: p.longitude})
        ) / 1000.0 AS distanceKm
        WHERE distanceKm <= $rayonKm
        RETURN p, distanceKm
        ORDER BY distanceKm ASC
      `,
        { hydravionId, rayonKm }
      );

      return result.records.map((record) => ({
        port: record.get("p").properties,
        distanceKm: record.get("distanceKm"),
      }));
    } finally {
      await session.close();
    }
  }
}
