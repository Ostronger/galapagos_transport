import type { Session } from "neo4j-driver";

export class PortRepository {
  constructor(private readonly sessionFactory: () => Session) {}

  async findAll() {
    const session = this.sessionFactory();
    try {
      const result = await session.run(`
        MATCH (p:Port)-[:SE_TROUVE_SUR]->(i:Ile)
        RETURN p, i
      `);

      return result.records.map((record) => {
        const p = record.get("p");
        const i = record.get("i");

        return {
          id: p.properties.id,
          nom: p.properties.nom,
          coordonnees: {
            latitude: p.properties.latitude,
            longitude: p.properties.longitude,
          },
          ile: {
            id: i.properties.id,
            nom: i.properties.nom,
          },
        };
      });
    } finally {
      await session.close();
    }
  }
}