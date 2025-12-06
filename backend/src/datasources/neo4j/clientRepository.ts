import type { Driver } from "neo4j-driver";

interface Client {
  id: string;
  nom?: string;
  [key: string]: any;
}
interface Commande {
  id: string;
  clientId?: string;
  date?: string | Date;
  [key: string]: any;
}

export class ClientNeo4jRepository {
  private driver: Driver;
  constructor(driver: Driver) {
    this.driver = driver;
  }

  private getSession() {
    return this.driver.session();
  }

  async findAll(): Promise<Client[]> {
    const session = this.getSession();
    try {
      const result = await session.run(`MATCH (c:Client) RETURN c`);
      return result.records.map((r) => r.get("c").properties as Client);
    } finally {
      await session.close();
    }
  }

  async findById(id: string): Promise<Client | null> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `MATCH (c:Client {id: $id}) RETURN c LIMIT 1`,
        { id }
      );
      const rec = result.records[0];
      return rec ? (rec.get("c").properties as Client) : null;
    } finally {
      await session.close();
    }
  }

  async findCommandesByClientId(clientId: string): Promise<Commande[]> {
    const session = this.getSession();
    try {
      // Match de façon générique toute relation sortante vers des noeuds Commande
      const result = await session.run(
        `MATCH (c:Client {id: $clientId})-[]->(cmd:Commande)
         RETURN cmd
         ORDER BY cmd.date`,
        { clientId }
      );
      return result.records.map((r) => {
        const props = r.get("cmd").properties as Commande;
        if (props.date) {
          // si la date est stockée en string, la convertir en Date côté JS
          try { props.date = new Date(props.date as string); } catch { /* noop */ }
        }
        return props;
      });
    } finally {
      await session.close();
    }
  }
}
