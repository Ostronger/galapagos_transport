import type { Db, Collection } from "mongodb";

export interface Commande {
  id: string;
  clientId: string;
  date: Date | string;
  caisses: string[];
  statut: "EN_PREPARATION" | "EN_COURS" | "LIVREE" | "ANNULEE" | "PLANIFIEE";
}

export class CommandeRepository {
  private commandesCollection: Collection<Commande>;
  private caissesCollection: Collection;

  constructor(db: Db) {
    this.commandesCollection = db.collection<Commande>("commandes");
    this.caissesCollection = db.collection("caisses");
  }

  async findAll(): Promise<Commande[]> {
    return (await this.commandesCollection.find().toArray()) as Commande[];
  }

  async findById(id: string): Promise<Commande | null> {
    return (await this.commandesCollection.findOne({
      id,
    })) as Commande | null;
  }

  async findByClientId(clientId: string): Promise<Commande[]> {
    return (await this.commandesCollection
      .find({ clientId })
      .toArray()) as Commande[];
  }

  async findEnCours(): Promise<Commande[]> {
    return (await this.commandesCollection
      .find({ statut: { $in: ["EN_PREPARATION", "EN_COURS"] } })
      .toArray()) as Commande[];
  }

  async getCaisses(commandeId: string) {
    const commande = await this.findById(commandeId);
    if (!commande) return [];

    return this.caissesCollection
      .find({ id: { $in: commande.caisses } })
      .toArray();
  }
}
