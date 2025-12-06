import type { Driver } from "neo4j-driver";

export class PortNeo4jRepository {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async findAll() {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (p:Port)
        OPTIONAL MATCH (p)-[:SITUE_SUR]->(i:Ile)
        RETURN p, i
      `);

      return result.records.map((record) => {
        const port = record.get("p").properties;
        const ile = record.get("i")?.properties;
        return {
          ...port,
          coordonnees: {
            latitude: port.latitude,
            longitude: port.longitude,
          },
          ile: ile ? { ...ile } : null,
        };
      });
    } finally {
      await session.close();
    }
  }

  async findById(id: string) {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (p:Port {id: $id})
        OPTIONAL MATCH (p)-[:SITUE_SUR]->(i:Ile)
        RETURN p, i
      `,
        { id }
      );

      if (result.records.length === 0) return null;

      const record = result.records[0];
      const port = record.get("p").properties;
      const ile = record.get("i")?.properties;

      return {
        ...port,
        coordonnees: {
          latitude: port.latitude,
          longitude: port.longitude,
        },
        ile: ile ? { ...ile } : null,
      };
    } finally {
      await session.close();
    }
  }
}
