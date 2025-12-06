import type { Db } from "mongodb";

export interface Hydravion {
  id: string;
  modele: string;
  capaciteActuelle: number;
  capaciteMax: number;
  consommationKm: number;
  niveauCarburant: number;
  niveauCarburantMax: number;
  etat: string;
  positionPortId?: string;
  positionGPS?: {
    latitude: number;
    longitude: number;
  };
}

export class HydravionRepository {
  private collection;

  constructor(db: Db) {
    this.collection = db.collection("hydravions");
  }

  async findAll() {
    return this.collection.find().toArray();
  }

  async findById(id: string) {
    return this.collection.findOne({ id });
  }
}
