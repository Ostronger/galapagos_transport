import type { Db } from "mongodb";

export class ClientRepository {
  private collection;

  constructor(db: Db) {
    this.collection = db.collection("clients");
  }

  async findAll() {
    return this.collection.find().toArray();
  }

  async findById(id: string) {
    // On utilise ton champ "id" logique (CLI-001) venant du dataset
    return this.collection.findOne({ id });
  }
}