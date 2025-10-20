import { firebaseConfigured } from './firebase';
import * as firebaseDb from './firebaseDb';
import * as localDb from './realtimeDb';

export const userStore = firebaseConfigured ? firebaseDb.userStore : localDb.userStore;
export const tableStore = firebaseConfigured ? firebaseDb.tableStore : localDb.tableStore;
export const onlineOrderStore = firebaseConfigured ? firebaseDb.onlineOrderStore : localDb.onlineOrderStore;
export const salesStore = firebaseConfigured ? firebaseDb.salesStore : localDb.salesStore;
export const db = firebaseConfigured ? firebaseDb.db : localDb.db;
