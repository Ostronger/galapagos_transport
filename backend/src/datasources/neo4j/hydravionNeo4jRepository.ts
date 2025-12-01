import type { Session } from "neo4j-driver";

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
  constructor(private readonly sessionFactory: () => Session) {}

  /**
   * Retourne l'état et le port éventuel de tous les hydravions.
   * Les infos "techniques" viennent de Mongo, ici on ne gère que le graphe.
   */
  async findAllStatusWithPort(): Promise<HydravionPosition[]> {
    const session = this.sessionFactory();

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
}