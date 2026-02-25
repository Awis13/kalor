// IndexedDB обёртка для хранения истории температуры
// Использует idb для удобного async API

import { openDB, type IDBPDatabase } from "idb";
import type { HistoryEntry } from "@/lib/agua-types";

const DB_NAME = "kalor-history";
const DB_VERSION = 1;
const STORE_NAME = "readings";

interface KalorDB {
  readings: {
    key: number; // autoIncrement
    value: HistoryEntry;
    indexes: {
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<KalorDB>> | null = null;

function getDB(): Promise<IDBPDatabase<KalorDB>> {
  if (!dbPromise) {
    dbPromise = openDB<KalorDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, {
          autoIncrement: true,
        });
        store.createIndex("timestamp", "timestamp");
      },
    });
  }
  return dbPromise;
}

// Добавить запись в историю
export async function addReading(entry: HistoryEntry): Promise<void> {
  const db = await getDB();
  await db.add(STORE_NAME, entry);
}

// Получить записи за диапазон времени (unix ms timestamps)
export async function getReadings(
  from: number,
  to: number
): Promise<HistoryEntry[]> {
  const db = await getDB();
  const range = IDBKeyRange.bound(from, to);
  return db.getAllFromIndex(STORE_NAME, "timestamp", range);
}

// Удалить записи старше указанного timestamp (unix ms)
export async function clearOldReadings(olderThan: number): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const index = tx.store.index("timestamp");
  const range = IDBKeyRange.upperBound(olderThan);

  let cursor = await index.openCursor(range);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;
}
