import type { Db } from "mongodb";

export type Hydravion = {
  id: string;
  modele: string;
  capacite: number;
  consommation: number;
};

export class HydravionRepository {
  private collection;

  constructor(db: Db) {
    this.collection = db.collection("hydravions");
  }

  async findAll(): Promise<Hydravion[]> {
    const docs = await this.collection.find().toArray();

    return docs.map((doc) => ({
      id: doc.id,
      modele: doc.modele,
      capacite: doc.capacite,
      consommation: doc.consommation,
    }));
  }
}