import type { Session } from "neo4j-driver";

export type TrajetNeo4j = {
  id: string;
  distanceKm: number | null;
  dureeMinutes: number | null;
  portDepart: {
    id: string;
    nom: string;
    latitude: number | null;
    longitude: number | null;
    ileId: string;
    ileNom: string;
  };
  portArrivee: {
    id: string;
    nom: string;
    latitude: number | null;
    longitude: number | null;
    ileId: string;
    ileNom: string;
  };
};

export class TrajetRepository {
  constructor(private readonly sessionFactory: () => Session) {}

  /**
   * Retourne tous les trajets du graphe.
   * Relation :RELIE_A avec propriété {distance}.
   */
  async findAll(): Promise<TrajetNeo4j[]> {
    const session = this.sessionFactory();
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
            latitude: (p1.properties.latitude as number) ?? null,
            longitude: (p1.properties.longitude as number) ?? null,
            ileId: i1.properties.id as string,
            ileNom: i1.properties.nom as string,
          },
          portArrivee: {
            id: p2.properties.id as string,
            nom: p2.properties.nom as string,
            latitude: (p2.properties.latitude as number) ?? null,
            longitude: (p2.properties.longitude as number) ?? null,
            ileId: i2.properties.id as string,
            ileNom: i2.properties.nom as string,
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
    const session = this.sessionFactory();
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
            latitude: (p1.properties.latitude as number) ?? null,
            longitude: (p1.properties.longitude as number) ?? null,
            ileId: i1.properties.id as string,
            ileNom: i1.properties.nom as string,
          },
          portArrivee: {
            id: p2.properties.id as string,
            nom: p2.properties.nom as string,
            latitude: (p2.properties.latitude as number) ?? null,
            longitude: (p2.properties.longitude as number) ?? null,
            ileId: i2.properties.id as string,
            ileNom: i2.properties.nom as string,
          },
        };
      });
    } finally {
      await session.close();
    }
  }
}