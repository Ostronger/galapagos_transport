import type { Db } from "mongodb";

export type Locker = {
  id: string;
  nom: string;
  capacite: number;
  occupe: number;
  plein: boolean;
};

export class LockerRepository {
  private collection;

  constructor(db: Db) {
    this.collection = db.collection("lockers");
  }

  async findAll(): Promise<Locker[]> {
    const docs = await this.collection.find().toArray();

    return docs.map((doc) => {
      const capacite = Number(doc.capacite ?? 0);
      const occupe = Number(doc.occupe ?? 0);

      return {
        id: doc.id,
        nom: doc.nom ?? doc.code ?? `Locker ${doc.id}`,
        capacite,
        occupe,
        plein: occupe >= capacite && capacite > 0,
      };
    });
  }
}