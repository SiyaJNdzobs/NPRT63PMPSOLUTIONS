import * as admin from "firebase-admin";
import { mockDb } from "./db-mock";

const hasAdminConfig = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

let db;
let auth;

if (hasAdminConfig) {
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    }
    db = admin.firestore();
    auth = admin.auth();
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error);
  }
}

// Fallback Firestore Client Wrapper for Mock Mode
if (!db) {
  const createDocSnap = (data, id, exists = true) => ({
    id,
    exists,
    data: () => data,
    get: (field) => data[field],
  });

  const createQuerySnap = (docs) => ({
    empty: docs.length === 0,
    size: docs.length,
    docs,
    forEach: (callback) => docs.forEach(callback),
    map: (callback) => docs.map(callback),
  });

  class MockCollection {
    constructor(collectionName, queryFilters = []) {
      this.name = collectionName;
      this.filters = queryFilters;
    }

    where(field, op, value) {
      const newFilters = [...this.filters, { field, op, value }];
      return new MockCollection(this.name, newFilters);
    }

    limit(num) {
      return this; // Stub limit for simplicity
    }

    orderBy(field, direction = "asc") {
      return this; // Stub order for simplicity
    }

    async get() {
      let data = mockDb.get(this.name);
      // Apply filters
      this.filters.forEach(({ field, op, value }) => {
        data = data.filter(doc => {
          const docVal = doc[field];
          if (op === "==") return docVal === value;
          if (op === ">") return docVal > value;
          if (op === "<") return docVal < value;
          if (op === "array-contains") return Array.isArray(docVal) && docVal.includes(value);
          return true;
        });
      });

      const docs = data.map(doc => {
        // Find ID field. Schemas use 'uid', 'rankId', 'taxiId', etc., or fall back to finding *Id or id.
        const idField = Object.keys(doc).find(k => k.toLowerCase().endsWith("id") || k === "uid") || "id";
        return createDocSnap(doc, doc[idField] || "mock-id");
      });

      return createQuerySnap(docs);
    }

    async add(docData) {
      const idField = Object.keys(docData).find(k => k.toLowerCase().endsWith("id") || k === "uid") || "id";
      const id = docData[idField] || `mock-${Math.random().toString(36).substr(2, 9)}`;
      docData[idField] = id;
      mockDb.insert(this.name, docData);
      return { id, get: async () => createDocSnap(docData, id) };
    }

    doc(id) {
      const findIdField = (doc) => {
        if (!doc) return 'id';
        if (doc.uid) return 'uid';
        // Try collection-name-based singular: 'qrCodes' → 'qrCodeId' (may not match)
        const computed = `${this.name.slice(0, -1)}Id`;
        if (doc[computed] !== undefined) return computed;
        // Fall back: find any field ending in 'Id' (e.g., qrId, rankId, taxiId)
        const anyId = Object.keys(doc).find(k => k !== 'createdAt' && k.endsWith('Id'));
        return anyId || 'id';
      };

      return {
        id,
        get: async () => {
          const items = mockDb.get(this.name);
          const item = items.find(doc => {
            const f = findIdField(doc);
            return doc[f] === id || doc.uid === id || doc.id === id;
          });
          return createDocSnap(item, id, !!item);
        },
        set: async (docData, options) => {
          const items = mockDb.get(this.name);
          const sample = items[0];
          const idField = findIdField(sample) || `${this.name.slice(0, -1)}Id`;
          const item = items.find(doc => doc[idField] === id || doc.uid === id || doc.id === id);
          if (item) {
            if (options && options.merge) {
              Object.assign(item, docData);
            } else {
              mockDb.delete(this.name, doc => doc[idField] === id || doc.uid === id || doc.id === id);
              docData[idField] = id;
              mockDb.insert(this.name, docData);
            }
          } else {
            const newIdField = findIdField(docData) || idField;
            docData[newIdField] = id;
            mockDb.insert(this.name, docData);
          }
          return { id };
        },
        update: async (updateData) => {
          const items = mockDb.get(this.name);
          const sample = items.find(doc => {
            const f = findIdField(doc);
            return doc[f] === id || doc.uid === id || doc.id === id;
          });
          if (sample) Object.assign(sample, updateData);
          return { id };
        },
        delete: async () => {
          const items = mockDb.get(this.name);
          const idField = findIdField(items[0]) || `${this.name.slice(0, -1)}Id`;
          mockDb.delete(this.name, doc => doc[idField] === id || doc.uid === id || doc.id === id);
          return true;
        }
      };
    }
  }

  db = {
    collection: (name) => new MockCollection(name),
  };

  // Mock Authentication APIs
  auth = {
    createUser: async (userRecord) => {
      const uid = `uid-${Math.random().toString(36).substr(2, 9)}`;
      return { uid, email: userRecord.email };
    },
    getUser: async (uid) => {
      const user = mockDb.findOne("users", doc => doc.uid === uid);
      if (!user) throw new Error("User not found");
      return { uid, email: user.email };
    },
    getUserByEmail: async (email) => {
      const user = mockDb.findOne("users", doc => doc.email === email);
      if (!user) throw new Error("User not found");
      return { uid: user.uid, email };
    },
    verifyIdToken: async (token) => {
      // Mock tokens are structured as "token-[uid]-[role]"
      if (token && token.startsWith("mock-token-")) {
        const parts = token.split("-");
        const uid = parts.slice(2, -1).join("-");
        const role = parts[parts.length - 1];
        return { uid, role, email: `${uid}@taxirank.co.za` };
      }
      throw new Error("Invalid mock token");
    }
  };
}

export { db, auth, hasAdminConfig };
