import type { Db } from "mongodb";

export interface Commande {
  id: string;
  clientId: string;
  date: Date;
  caisses: string[];
  statut: "EN_PREPARATION" | "EN_COURS" | "LIVREE" | "ANNULEE";
}

export class CommandeRepository {
  private commandesCollection;
  private caissesCollection;

  constructor(db: Db) {
    this.commandesCollection = db.collection("commandes");
    this.caissesCollection = db.collection("caisses");
  }

  async findAll(): Promise<Commande[]> {
    return (await this.commandesCollection
      .find()
      .toArray()) as unknown as Commande[];
  }

  async findById(id: string): Promise<Commande | null> {
    return (await this.commandesCollection.findOne({
      id,
    })) as unknown as Commande | null;
  }

  async findByClientId(clientId: string): Promise<Commande[]> {
    return (await this.commandesCollection
      .find({ clientId })
      .toArray()) as unknown as Commande[];
  }

  async findEnCours(): Promise<Commande[]> {
    return (await this.commandesCollection
      .find({ statut: { $in: ["EN_PREPARATION", "EN_COURS"] } })
      .toArray()) as unknown as Commande[];
  }

  async create(input: {
    clientId: string;
    caisseIds: string[];
  }): Promise<Commande> {
    const newCommande: Commande = {
      id: `CMD-${Date.now()}`,
      clientId: input.clientId,
      date: new Date(),
      caisses: input.caisseIds,
      statut: "EN_PREPARATION",
    };

    await this.commandesCollection.insertOne(newCommande);
    return newCommande;
  }

  async updateStatut(
    id: string,
    statut: Commande["statut"]
  ): Promise<Commande | null> {
    const result = await this.commandesCollection.findOneAndUpdate(
      { id },
      { $set: { statut } },
      { returnDocument: "after" }
    );

    return result as unknown as Commande | null;
  }

  async getCaisses(commandeId: string) {
    const commande = await this.findById(commandeId);
    if (!commande) return [];

    return this.caissesCollection
      .find({ id: { $in: commande.caisses } })
      .toArray();
  }
}
