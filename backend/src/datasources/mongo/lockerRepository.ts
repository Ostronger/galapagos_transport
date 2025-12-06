import type { Db } from "mongodb";

export type Locker = {
  id: string;
  nom: string;
  capacite: number;
  occupe: number;
  plein: boolean;
};

export class LockerRepository {
  private lockersCollection;
  private caissesCollection;
  private produitsCollection;

  constructor(db: Db) {
    this.lockersCollection = db.collection("lockers");
    this.caissesCollection = db.collection("caisses");
    this.produitsCollection = db.collection("produits");
  }

  async findAll(): Promise<Locker[]> {
    const docs = await this.lockersCollection.find().toArray();

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

  async findByPortId(portId: string, filtreVide?: boolean) {
    const query: any = { portId };

    if (filtreVide !== undefined) {
      query.estVide = filtreVide;
    }

    return this.lockersCollection.find(query).toArray();
  }

  async findCaisseById(caisseId: string) {
    return this.caissesCollection.findOne({ id: caisseId });
  }

  async findAllProduits() {
    return this.produitsCollection.find().toArray();
  }
}
