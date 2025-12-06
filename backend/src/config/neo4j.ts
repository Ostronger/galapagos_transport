import neo4j, { Driver } from "neo4j-driver";

const driver: Driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
);

export function getNeo4jDriver(): Driver {
  return driver;
}

export function getNeo4jSession() {
  return driver.session();
}
