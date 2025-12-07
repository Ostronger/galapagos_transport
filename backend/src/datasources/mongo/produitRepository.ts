import type { Db } from "mongodb";

export interface Produit {
  id: string;
  nom: string;
  quantiteStocks: number;
}

export class ProduitRepository {
  private produitsCollection;

  constructor(db: Db) {
    this.produitsCollection = db.collection("produits");
  }

  async findAll(): Promise<Produit[]> {
    return (await this.produitsCollection
      .find()
      .toArray()) as unknown as Produit[];
  }

  async findById(id: string): Promise<Produit | null> {
    return (await this.produitsCollection.findOne({
      id,
    })) as unknown as Produit | null;
  }

  async updateStock(id: string, quantite: number): Promise<Produit | null> {
    const result = await this.produitsCollection.findOneAndUpdate(
      { id },
      { $inc: { quantiteStocks: quantite } },
      { returnDocument: "after" }
    );

    return result as unknown as Produit | null;
  }

  async getStockDisponible(id: string): Promise<number> {
    const produit = await this.findById(id);
    return produit?.quantiteStocks ?? 0;
  }
}
