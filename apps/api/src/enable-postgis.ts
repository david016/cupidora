import { DataSource } from 'typeorm';

export async function enablePostGIS(dataSource: DataSource): Promise<void> {
  await dataSource.query('CREATE EXTENSION IF NOT EXISTS postgis');
}
