import type { Db, Collection } from "mongodb";

interface Client {
  id: string;
  nom: string;
  historiqueCommandes: string[];
}

interface Commande {
  id: string;
  clientId: string;
  date: Date | string;
  caisses: string[];
  statut: "EN_PREPARATION" | "EN_COURS" | "LIVREE" | "ANNULEE" | "PLANIFIEE";
}

export class ClientRepository {
  private collection: Collection<Client>;
  private commandesCollection: Collection<Commande>;

  constructor(db: Db) {
    this.collection = db.collection<Client>("clients");
    this.commandesCollection = db.collection<Commande>("commandes");
  }

  async findAll(): Promise<Client[]> {
    return await this.collection.find().toArray();
  }

  async findById(id: string): Promise<Client | null> {
    return await this.collection.findOne({ id });
  }

  async findCommandesByClientId(clientId: string): Promise<Commande[]> {
    return await this.commandesCollection.find({ clientId }).toArray();
  }
}
