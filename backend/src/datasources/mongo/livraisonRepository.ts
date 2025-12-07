import type { Db } from "mongodb";

export interface Livraison {
  id: string;
  commandeId: string;
  hydravionId: string;
  portDepartId: string;
  portArriveeId: string;
  dateDepart?: Date;
  dateArrivee?: Date;
  statut: "PLANIFIEE" | "EN_COURS" | "LIVREE" | "ANNULEE";
  caisses: string[];
  clientId?: string; // Optionnel, peuplé lors de la jointure
}

export class LivraisonRepository {
  private livraisonsCollection;
  private commandesCollection;

  constructor(db: Db) {
    this.livraisonsCollection = db.collection("livraisons");
    this.commandesCollection = db.collection("commandes");
  }

  async findAll(): Promise<Livraison[]> {
    return (await this.livraisonsCollection
      .find()
      .toArray()) as unknown as Livraison[];
  }

  async findById(id: string): Promise<Livraison | null> {
    return (await this.livraisonsCollection.findOne({
      id,
    })) as unknown as Livraison | null;
  }

  async findByClientId(clientId: string): Promise<Livraison[]> {
    const pipeline = [
      {
        $lookup: {
          from: "commandes",
          localField: "commandeId",
          foreignField: "id",
          as: "commande",
        },
      },
      {
        $unwind: "$commande",
      },
      {
        $match: {
          "commande.clientId": clientId,
        },
      },
      {
        $addFields: {
          clientId: "$commande.clientId",
        },
      },
      {
        $project: {
          commande: 0,
        },
      },
    ];

    return (await this.livraisonsCollection
      .aggregate(pipeline)
      .toArray()) as unknown as Livraison[];
  }

  async create(input: {
    commandeId: string;
    hydravionId: string;
    portDepartId: string;
    portArriveeId: string;
  }): Promise<Livraison> {
    const newLivraison: Livraison = {
      id: `LIV-${Date.now()}`,
      commandeId: input.commandeId,
      hydravionId: input.hydravionId,
      portDepartId: input.portDepartId,
      portArriveeId: input.portArriveeId,
      statut: "PLANIFIEE",
      caisses: [],
    };

    await this.livraisonsCollection.insertOne(newLivraison);
    return newLivraison;
  }

  async demarrer(id: string): Promise<Livraison | null> {
    const result = await this.livraisonsCollection.findOneAndUpdate(
      { id },
      { $set: { statut: "EN_COURS", dateDepart: new Date() } },
      { returnDocument: "after" }
    );

    return result as unknown as Livraison | null;
  }

  async terminer(id: string): Promise<Livraison | null> {
    const result = await this.livraisonsCollection.findOneAndUpdate(
      { id },
      { $set: { statut: "LIVREE", dateArrivee: new Date() } },
      { returnDocument: "after" }
    );

    return result as unknown as Livraison | null;
  }
}
