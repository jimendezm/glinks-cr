import Dexie, { Table } from 'dexie';

export interface OfflineClient {
  id: string;
  tipo: 'fisico' | 'juridico';
  data: any;
  createdAt: Date;
  synced: boolean;
}

export interface OfflineProduct {
  id: string;
  data: any;
  createdAt: Date;
  synced: boolean;
}

export interface OfflineMaintenance {
  id: string;
  data: any;
  createdAt: Date;
  synced: boolean;
}

export interface OfflineInvoice {
  id: string;
  data: any;
  createdAt: Date;
  synced: boolean;
}

export interface OfflineQueue {
  id?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'client' | 'product' | 'maintenance' | 'invoice';
  entityId: string;
  data: any;
  createdAt: Date;
  retries: number;
}

class GLinksDB extends Dexie {
  offlineClients!: Table<OfflineClient, string>;
  offlineProducts!: Table<OfflineProduct, string>;
  offlineMaintenances!: Table<OfflineMaintenance, string>;
  offlineInvoices!: Table<OfflineInvoice, string>;
  syncQueue!: Table<OfflineQueue, number>;

  constructor() {
    super('GLinksDB');
    
    this.version(1).stores({
      offlineClients: 'id, createdAt, synced',
      offlineProducts: 'id, createdAt, synced',
      offlineMaintenances: 'id, createdAt, synced',
      offlineInvoices: 'id, createdAt, synced',
      syncQueue: '++id, action, entity, entityId, createdAt',
    });
  }
}

export const db = new GLinksDB();