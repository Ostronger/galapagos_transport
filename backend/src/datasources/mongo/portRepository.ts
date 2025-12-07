import type { Db } from "mongodb";

export interface Coordonnees {
  latitude: number;
  longitude: number;
}

export interface Ile {
  id: string;
  nom: string;
}

export interface Port {
  id: string;
  nom: string;
  coordonnees: Coordonnees;
  ile: Ile;
  capaciteHydravions: number;
  capaciteHydravionsMax: number;
}

export class PortRepository {
  private collection;
  private ileCollection;

  constructor(db: Db) {
    this.collection = db.collection("ports");
    this.ileCollection = db.collection("iles");
  }

  async findAll() {
    const ports = await this.collection.find().toArray();
    return Promise.all(
      ports.map(async (port) => {
        if (typeof port.ile === "string") {
          const ile = await this.ileCollection.findOne({ id: port.ile });
          port.ile = ile ? { id: ile.id, nom: ile.nom } : null;
        }
        return port;
      })
    );
  }

  async findById(id: string) {
    const port = await this.collection.findOne({ id });
    if (!port) return null;
    if (typeof port.ile === "string") {
      const ile = await this.ileCollection.findOne({ id: port.ile });
      port.ile = ile ? { id: ile.id, nom: ile.nom } : null;
    }
    return port;
  }
}
