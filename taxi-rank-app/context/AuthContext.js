/**
 * context/AuthContext.js — E-RANK Authentication Context
 *
 * Handles four distinct auth models per the spec:
 *
 *   Admin    → Supabase Auth email + password
 *   Owner    → Supabase Auth (internal email = cell@erank.app) + password
 *   Marshal  → Supabase Auth (internal email = cell@erank.app) + password
 *              First login detected via user_metadata.force_reset = true
 *   Driver   → PIN-based via taxis table verify_pin() RPC (no Supabase Auth)
 *              First login detected via AsyncStorage flag
 *   Passenger → No auth — direct access
 *
 * Rate limit: check_login_rate_limit() RPC called before every non-admin login.
 * Login attempts logged to login_attempts table.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, callEdgeFunction } from '../lib/supabaseClient';
import { AUTH_EMAIL_DOMAIN } from '../lib/constants';

const AuthContext = createContext({});

const cellToEmail = (cell) => `${cell.trim()}@${AUTH_EMAIL_DOMAIN}`;
const DRIVER_FIRST_LOGIN_KEY = 'erank_driver_first_login_done';

export const AuthProvider = ({ children }) => {
  const [session, setSession]         = useState(null);
  const [profile, setProfile]         = useState(null); // public.users row
  const [driver,  setDriver]          = useState(null); // taxis row (driver only)
  const [loading, setLoading]         = useState(true);
  const [forceReset, setForceReset]   = useState(false); // first-login reset required

  // ── Fetch public.users profile ───────────────────────────────────────────
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) { console.error('[Auth] fetchProfile:', error.message); return null; }
    return data;
  };

  // ── Restore session on mount ─────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        const p = await fetchProfile(s.user.id);
        setProfile(p);
        if (s.user.user_metadata?.force_reset) setForceReset(true);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        if (s?.user) {
          const p = await fetchProfile(s.user.id);
          setProfile(p);
          if (s.user.user_metadata?.force_reset) setForceReset(true);
        } else {
          setProfile(null);
          setDriver(null);
          setForceReset(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // ── Log login attempt ────────────────────────────────────────────────────
  const logAttempt = async (cellNumber, success) => {
    await supabase.from('login_attempts').insert({ cell_number: cellNumber, success });
  };

  // ── Check rate limit (returns { allowed, minutesLeft }) ──────────────────
  const checkRateLimit = async (cellNumber) => {
    const { data: allowed } = await supabase.rpc('check_login_rate_limit', {
      p_cell: cellNumber,
    });
    return { allowed: allowed !== false };
  };

  // ── Admin login (email + password) ───────────────────────────────────────
  const loginAdmin = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Email or password incorrect.');
    const p = await fetchProfile(data.user.id);
    if (!p || p.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error('Account not authorised as Admin.');
    }
    setProfile(p);
    return 'admin';
  };

  // ── Owner / Marshal login (cell number + password) ───────────────────────
  const loginStaff = async (cellNumber, password, expectedRole) => {
    const { allowed } = await checkRateLimit(cellNumber);
    if (!allowed) {
      throw { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in 15 minutes.' };
    }

    const email = cellToEmail(cellNumber);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    await logAttempt(cellNumber, !error);

    if (error) throw new Error('Cell number or password incorrect.');

    const p = await fetchProfile(data.user.id);
    if (!p || p.role !== expectedRole) {
      await supabase.auth.signOut();
      throw new Error(`Account not registered as ${expectedRole}.`);
    }

    setProfile(p);

    // Check first-login reset flag (set by create-marshal Edge Function)
    if (data.user.user_metadata?.force_reset) setForceReset(true);

    return expectedRole;
  };

  // ── Driver login (cell number + 6-digit PIN) ─────────────────────────────
  const loginDriver = async (cellNumber, pin) => {
    const { allowed } = await checkRateLimit(cellNumber);
    if (!allowed) {
      throw { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in 15 minutes.' };
    }

    const { data: taxi, error: taxiErr } = await supabase
      .from('taxis')
      .select('*')
      .eq('driver_cell', cellNumber.trim())
      .single();

    await logAttempt(cellNumber, !taxiErr && !!taxi);

    if (taxiErr || !taxi) throw new Error('Incorrect PIN.');

    const { data: valid } = await supabase.rpc('verify_pin', {
      plain_pin:   pin.trim(),
      stored_hash: taxi.driver_pin_hash,
    });

    if (!valid) {
      await logAttempt(cellNumber, false);
      throw new Error('Incorrect PIN.');
    }

    setDriver(taxi);

    // Check first-login: has this driver completed their PIN reset on this device?
    const doneList = JSON.parse(await AsyncStorage.getItem(DRIVER_FIRST_LOGIN_KEY) || '[]');
    if (!doneList.includes(cellNumber)) setForceReset(true);

    return 'driver';
  };

  // ── Register Owner (calls register-owner Edge Function) ──────────────────
  const registerOwner = async (fullName, cellNumber, password) => {
    const { data, error } = await callEdgeFunction('register-owner', {
      full_name:   fullName.trim(),
      cell_number: cellNumber.trim(),
      password,
    });
    if (error || !data?.success) {
      const msg = data?.error || error?.message || 'Registration failed.';
      if (msg.toLowerCase().includes('already')) throw new Error('This cell number is already registered.');
      throw new Error(msg);
    }
  };

  // ── Complete first-login reset (Marshal: new password) ───────────────────
  const completePasswordReset = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: { force_reset: false },
    });
    if (error) throw new Error(error.message);
    setForceReset(false);
  };

  // ── Complete first-login reset (Driver: new PIN) ──────────────────────────
  const completePINReset = async (newPin) => {
    if (!driver) throw new Error('No active driver session.');
    const { error } = await supabase.rpc('update_driver_pin', {
      p_taxi_id: driver.id,
      p_new_pin: newPin.trim(),
    });
    if (error) throw new Error(error.message);

    // Mark this driver as done on this device
    const doneList = JSON.parse(await AsyncStorage.getItem(DRIVER_FIRST_LOGIN_KEY) || '[]');
    doneList.push(driver.driver_cell);
    await AsyncStorage.setItem(DRIVER_FIRST_LOGIN_KEY, JSON.stringify(doneList));
    setForceReset(false);
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setDriver(null);
    setForceReset(false);
  };

  // ── Context value ─────────────────────────────────────────────────────────
  return (
    <AuthContext.Provider value={{
      session, profile, driver, loading, forceReset,
      login: loginStaff, loginAdmin, loginStaff, loginDriver,
      registerOwner,
      completePasswordReset, completePINReset,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);