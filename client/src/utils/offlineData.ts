/**
 * Offline Data Management
 * 
 * Utilities for handling offline data storage and synchronization
 */

interface OfflineDataItem {
  id?: number;
  type: 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  payload?: any;
  timestamp: number;
}

/**
 * Store data for offline sync
 */
export const storeOfflineData = async (data: Omit<OfflineDataItem, 'id' | 'timestamp'>): Promise<void> => {
  const item: OfflineDataItem = {
    ...data,
    timestamp: Date.now()
  };

  try {
    // Try IndexedDB first
    await storeInIndexedDB(item);
  } catch (error) {
    // Fallback to localStorage
    storeInLocalStorage(item);
  }
};

/**
 * Store data in IndexedDB
 */
async function storeInIndexedDB(item: OfflineDataItem): Promise<void> {
  const db = await openIndexedDB();
  const transaction = db.transaction(['pendingData'], 'readwrite');
  const store = transaction.objectStore('pendingData');
  await store.add(item);
}

/**
 * Store data in localStorage (fallback)
 */
function storeInLocalStorage(item: OfflineDataItem): void {
  try {
    const existing = localStorage.getItem('pendingData');
    const data = existing ? JSON.parse(existing) : [];
    data.push(item);
    localStorage.setItem('pendingData', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to store offline data in localStorage:', error);
  }
}

/**
 * Get all pending offline data
 */
export const getOfflineData = async (): Promise<OfflineDataItem[]> => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['pendingData'], 'readonly');
    const store = transaction.objectStore('pendingData');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    // Fallback to localStorage
    return getOfflineDataFromLocalStorage();
  }
};

/**
 * Get offline data from localStorage (fallback)
 */
function getOfflineDataFromLocalStorage(): OfflineDataItem[] {
  try {
    const data = localStorage.getItem('pendingData');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get offline data from localStorage:', error);
    return [];
  }
}

/**
 * Remove synced data from storage
 */
export const removeSyncedData = async (id: number): Promise<void> => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['pendingData'], 'readwrite');
    const store = transaction.objectStore('pendingData');
    await store.delete(id);
  } catch (error) {
    // Fallback to localStorage
    removeFromLocalStorage(id);
  }
};

/**
 * Remove from localStorage (fallback)
 */
function removeFromLocalStorage(id: number): void {
  try {
    const existing = localStorage.getItem('pendingData');
    if (existing) {
      const data = JSON.parse(existing);
      const filtered = data.filter((item: OfflineDataItem) => item.id !== id);
      localStorage.setItem('pendingData', JSON.stringify(filtered));
    }
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

/**
 * Clear all offline data
 */
export const clearOfflineData = async (): Promise<void> => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['pendingData'], 'readwrite');
    const store = transaction.objectStore('pendingData');
    await store.clear();
  } catch (error) {
    // Fallback to localStorage
    localStorage.removeItem('pendingData');
  }
};

/**
 * Open IndexedDB connection
 */
async function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BuildBossOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store for pending data
      if (!db.objectStoreNames.contains('pendingData')) {
        const store = db.createObjectStore('pendingData', { keyPath: 'id', autoIncrement: true });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Check if there's pending offline data
 */
export const hasOfflineData = async (): Promise<boolean> => {
  const data = await getOfflineData();
  return data.length > 0;
};

/**
 * Get offline data count
 */
export const getOfflineDataCount = async (): Promise<number> => {
  const data = await getOfflineData();
  return data.length;
}; 