import { db } from '@/lib/db';
import { http, getToken } from '../httpClient';
import { physicalClientsApi, legalClientsApi } from './clientes';
import { productosApi } from './productos';
import { mantenimientosApi } from './mantenimientos';
import { facturasApi } from './facturas';
import type { CreatePhysicalClientInput, CreateLegalClientInput } from './clientes';
import type { CreateProductInput } from './productos';
import type { CreateMaintenanceInput } from './mantenimientos';
import type { CreatePhysicalInvoiceInput, CreateLegalInvoiceInput } from './facturas';

// Estado de conexión
let isOnline = navigator.onLine;
let syncInProgress = false;
let syncInterval: NodeJS.Timeout | null = null;

// Escuchar cambios de conexión
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    console.log('🟢 [Sync] Conexión restablecida, iniciando sincronización...');
    startSync();
  });
  
  window.addEventListener('offline', () => {
    isOnline = false;
    console.log('🔴 [Sync] Conexión perdida, modo offline activado');
  });
}

// Verificar si hay conexión a internet (rápido)
let lastConnectionCheck = 0;
let cachedConnectionStatus = true;

export async function checkConnection(): Promise<boolean> {
  // Primero verificar navigator.onLine (instantáneo)
  if (!navigator.onLine) {
    cachedConnectionStatus = false;
    return false;
  }
  
  // Usar caché para no hacer peticiones constantes (cada 5 segundos)
  const now = Date.now();
  if (now - lastConnectionCheck < 5000) {
    return cachedConnectionStatus;
  }
  
  lastConnectionCheck = now;
  
  // Verificar con petición HEAD a la API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${process.env.VITE_API_URL || 'http://localhost:3000/api'}/health`, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    cachedConnectionStatus = response.ok;
    return cachedConnectionStatus;
  } catch {
    cachedConnectionStatus = false;
    return false;
  }
}

// Guardar un registro OFFLINE (no espera respuesta del servidor)
export async function saveOfflineRecord(
  entity: 'client' | 'product' | 'maintenance' | 'invoice',
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  id: string,
  data: any
): Promise<void> {
  console.log(`📦 [Sync] Guardando en cola: ${action} ${entity} - ${id}`);
  
  // Agregar a la cola de sincronización
  await db.syncQueue.add({
    action,
    entity,
    entityId: id,
    data,
    createdAt: new Date(),
    retries: 0,
  });
  
  // También guardar una copia del registro completo para consulta offline
  await saveOfflineData(entity, id, data, action);
  
  console.log(`✅ [Sync] Registro en cola: ${db.syncQueue.count()} pendientes`);
}

// Guardar copia de datos para consulta offline
async function saveOfflineData(entity: string, id: string, data: any, action: string): Promise<void> {
  const offlineRecord = {
    id,
    data,
    createdAt: new Date(),
    synced: false,
  };
  
  switch (entity) {
    case 'client':
      await db.offlineClients.put(offlineRecord);
      break;
    case 'product':
      await db.offlineProducts.put(offlineRecord);
      break;
    case 'maintenance':
      await db.offlineMaintenances.put(offlineRecord);
      break;
    case 'invoice':
      await db.offlineInvoices.put(offlineRecord);
      break;
  }
}

// Obtener todos los registros offline para mostrar en el frontend
export async function getOfflineData(
  entity: 'client' | 'product' | 'maintenance' | 'invoice'
): Promise<any[]> {
  let records: any[] = [];
  
  switch (entity) {
    case 'client':
      records = await db.offlineClients.toArray();
      break;
    case 'product':
      records = await db.offlineProducts.toArray();
      break;
    case 'maintenance':
      records = await db.offlineMaintenances.toArray();
      break;
    case 'invoice':
      records = await db.offlineInvoices.toArray();
      break;
  }
  
  // Filtrar solo los que no están sincronizados o son temporales
  return records.filter(r => !r.synced).map(r => ({
    ...r.data,
    id: r.id,
    _offline: true,
    _pendingSync: !r.synced,
  }));
}

// Sincronizar registros pendientes
export async function startSync(): Promise<{ success: number; failed: number }> {
  const isOnlineNow = await checkConnection();
  if (!isOnlineNow) {
    console.log('📡 [Sync] Sin conexión, no se puede sincronizar');
    return { success: 0, failed: 0 };
  }
  
  if (syncInProgress) {
    console.log('🔄 [Sync] Sincronización ya en curso...');
    return { success: 0, failed: 0 };
  }
  
  syncInProgress = true;
  console.log('🚀 [Sync] Iniciando sincronización de datos pendientes...');
  
  let success = 0;
  let failed = 0;
  
  try {
    // Obtener todos los elementos de la cola ordenados por fecha
    const queueItems = await db.syncQueue.orderBy('createdAt').toArray();
    
    console.log(`📋 [Sync] ${queueItems.length} registros pendientes`);
    
    for (const item of queueItems) {
      try {
        console.log(`📤 [Sync] Sincronizando ${item.action} ${item.entity} ${item.entityId}`);
        
        const token = getToken();
        if (!token) {
          throw new Error('No hay token de autenticación');
        }
        
        let result = false;
        
        switch (`${item.action}_${item.entity}`) {
          case 'CREATE_client':
            result = await syncCreateClient(item.data);
            break;
          case 'CREATE_product':
            result = await syncCreateProduct(item.data);
            break;
          case 'CREATE_maintenance':
            result = await syncCreateMaintenance(item.data);
            break;
          case 'CREATE_invoice':
            result = await syncCreateInvoice(item.data);
            break;
          case 'UPDATE_client':
            result = await syncUpdateClient(item.entityId, item.data);
            break;
          case 'UPDATE_product':
            result = await syncUpdateProduct(item.entityId, item.data);
            break;
          case 'DELETE_client':
            result = await syncDeleteClient(item.entityId, item.data);
            break;
          case 'DELETE_product':
            result = await syncDeleteProduct(item.entityId);
            break;
          default:
            console.log(`⚠️ [Sync] Acción no soportada: ${item.action}_${item.entity}`);
            result = true;
        }
        
        if (result) {
          // Eliminar de la cola si fue exitoso
          await db.syncQueue.delete(item.id!);
          await markAsSynced(item.entity, item.entityId);
          success++;
          console.log(`✅ [Sync] Sincronizado: ${item.entityId}`);
        } else {
          failed++;
          throw new Error('Falló la sincronización');
        }
        
      } catch (error) {
        console.error(`❌ [Sync] Error sincronizando ${item.entityId}:`, error);
        failed++;
        
        // Incrementar contador de reintentos
        await db.syncQueue.update(item.id!, {
          retries: (item.retries || 0) + 1,
        });
      }
    }
    
    console.log(`✅ [Sync] Sincronización completada: ${success} éxitos, ${failed} fallos`);
  } catch (error) {
    console.error('❌ [Sync] Error durante sincronización:', error);
  } finally {
    syncInProgress = false;
  }
  
  return { success, failed };
}

// Funciones de sincronización específicas
async function syncCreateClient(data: any): Promise<boolean> {
  try {
    if (data.tipo === 'fisico') {
      const input: CreatePhysicalClientInput = {
        nationalId: data.national_id || data.nationalId,
        name: data.name,
        lastName1: data.last_name_1 || data.lastName1,
        lastName2: data.last_name_2 || data.lastName2,
        primaryPhone: data.primary_phone || data.primaryPhone,
        secondaryPhone: data.secondary_phone || data.secondaryPhone || null,
        email: data.email || null,
        address: data.address,
        exonerated: data.exonerated,
      };
      await physicalClientsApi.create(input);
    } else {
      const input: CreateLegalClientInput = {
        legalId: data.legal_id || data.legalId,
        name: data.name,
        primaryPhone: data.primary_phone || data.primaryPhone,
        secondaryPhone: data.secondary_phone || data.secondaryPhone || null,
        email: data.email || null,
        address: data.address,
        exonerated: data.exonerated,
      };
      await legalClientsApi.create(input);
    }
    return true;
  } catch (error) {
    console.error('Error creando cliente:', error);
    return false;
  }
}

async function syncCreateProduct(data: any): Promise<boolean> {
  try {
    const input: CreateProductInput = {
      name: data.name,
      type: data.type,
      description: data.description || '',
      unit_price: data.unit_price || data.unitPrice,
      billable: data.billable,
    };
    await productosApi.create(input);
    return true;
  } catch (error) {
    console.error('Error creando producto:', error);
    return false;
  }
}

async function syncCreateMaintenance(data: any): Promise<boolean> {
  try {
    const input: CreateMaintenanceInput = {
      description: data.description,
      maintenanceProducts: data.maintenanceProducts || [],
    };
    
    if (data.physicalClientId) {
      await mantenimientosApi.createPhysical({ ...input, physicalClientId: data.physicalClientId });
    } else {
      await mantenimientosApi.createLegal({ ...input, legalClientId: data.legalClientId });
    }
    return true;
  } catch (error) {
    console.error('Error creando mantenimiento:', error);
    return false;
  }
}

async function syncCreateInvoice(data: any): Promise<boolean> {
  try {
    if (data.physicalClientId) {
      const input: CreatePhysicalInvoiceInput = {
        physicalClientId: data.physicalClientId,
        physicalProductItems: data.physicalProductItems || [],
        serviceProductItems: data.serviceProductItems || [],
      };
      await facturasApi.createPhysical(input);
    } else {
      const input: CreateLegalInvoiceInput = {
        legalClientId: data.legalClientId,
        physicalProductItems: data.physicalProductItems || [],
        serviceProductItems: data.serviceProductItems || [],
      };
      await facturasApi.createLegal(input);
    }
    return true;
  } catch (error) {
    console.error('Error creando factura:', error);
    return false;
  }
}

async function syncUpdateClient(id: string, data: any): Promise<boolean> {
  try {
    if (data.tipo === 'fisico') {
      await physicalClientsApi.update(id, data);
    } else {
      await legalClientsApi.update(id, data);
    }
    return true;
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    return false;
  }
}

async function syncUpdateProduct(id: string, data: any): Promise<boolean> {
  try {
    await productosApi.update(id, data);
    return true;
  } catch (error) {
    console.error('Error actualizando producto:', error);
    return false;
  }
}

async function syncDeleteClient(id: string, data: any): Promise<boolean> {
  try {
    if (data.tipo === 'fisico') {
      await physicalClientsApi.remove(id);
    } else {
      await legalClientsApi.remove(id);
    }
    return true;
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    return false;
  }
}

async function syncDeleteProduct(id: string): Promise<boolean> {
  try {
    await productosApi.remove(id);
    return true;
  } catch (error) {
    console.error('Error eliminando producto:', error);
    return false;
  }
}

async function markAsSynced(entity: string, entityId: string): Promise<void> {
  switch (entity) {
    case 'client':
      await db.offlineClients.update(entityId, { synced: true });
      break;
    case 'product':
      await db.offlineProducts.update(entityId, { synced: true });
      break;
    case 'maintenance':
      await db.offlineMaintenances.update(entityId, { synced: true });
      break;
    case 'invoice':
      await db.offlineInvoices.update(entityId, { synced: true });
      break;
  }
}

// Iniciar sincronización periódica
export function initSyncScheduler(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  syncInterval = setInterval(() => {
    startSync();
  }, 30000);
  
  startSync();
}

export function stopSyncScheduler(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export async function getPendingCount(): Promise<number> {
  return await db.syncQueue.count();
}

export async function clearOfflineData(): Promise<void> {
  await db.offlineClients.clear();
  await db.offlineProducts.clear();
  await db.offlineMaintenances.clear();
  await db.offlineInvoices.clear();
  await db.syncQueue.clear();
  console.log('🧹 [Sync] Datos offline limpiados');
}