/**
 * lib/offlineQueue.js — Offline-first operation cache
 *
 * Writes pending Supabase operations to AsyncStorage when offline.
 * Flushes them automatically when connectivity returns.
 * Exposes a visible sync status so users trust the app during
 * load-shedding / poor signal — common in South African taxi rank contexts.
 *
 * Usage:
 *   import { enqueue, useSyncStatus } from '../lib/offlineQueue';
 *   await enqueue({ table: 'queue_entries', op: 'insert', payload: {...} });
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'erank_offline_queue';

// ── Read the pending queue from storage ───────────────────────────────────────
const readQueue = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// ── Write the pending queue to storage ───────────────────────────────────────
const writeQueue = async (queue) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};

// ── Add an operation to the pending queue ─────────────────────────────────────
/**
 * @param {{ table: string, op: 'insert'|'update'|'upsert', payload: object, match?: object }} item
 */
export const enqueue = async (item) => {
  const queue = await readQueue();
  queue.push({ ...item, enqueuedAt: Date.now() });
  await writeQueue(queue);
};

// ── Flush all pending operations to Supabase ─────────────────────────────────
let _setSyncStatus = null; // injected by the useSyncStatus hook

export const flush = async () => {
  const queue = await readQueue();
  if (queue.length === 0) return;

  _setSyncStatus?.('syncing');

  const failed = [];
  for (const item of queue) {
    try {
      let query = supabase.from(item.table);
      if (item.op === 'insert')  await query.insert(item.payload);
      if (item.op === 'update')  await query.update(item.payload).match(item.match ?? {});
      if (item.op === 'upsert')  await query.upsert(item.payload);
    } catch {
      failed.push(item); // keep for next retry
    }
  }

  await writeQueue(failed);
  _setSyncStatus?.(failed.length === 0 ? 'synced' : 'error');
};

// ── React hook: subscribe to sync status ─────────────────────────────────────
/**
 * Returns: 'idle' | 'syncing' | 'synced' | 'offline' | 'error'
 */
export const useSyncStatus = () => {
  const [status, setStatus] = useState('idle');
  _setSyncStatus = setStatus;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        flush();
      } else {
        setStatus('offline');
      }
    });
    return () => unsubscribe();
  }, []);

  return status;
};
