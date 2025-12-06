import type { Db, Collection } from "mongodb";

// Ajout de types minimaux pour clarifier les retours et la collection
interface Client {
  id: string;
  nom?: string;
  [key: string]: any;
}
interface Commande {
  id: string;
  clientId: string;
  date?: Date | string;
  [key: string]: any;
}

export class ClientRepository {
  // typage des collections
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
