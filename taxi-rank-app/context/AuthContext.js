/**
 * AuthContext.js
 * ──────────────
 * Global authentication context for the E-RANK app.
 *
 * Auth strategy (per the DB schema):
 *
 *  • Owners / Marshals / Admins  →  Supabase Auth (email + password)
 *      Internal email format: {cellNumber}@erank.app
 *      Role is fetched from public.users after sign-in.
 *
 *  • Drivers  →  PIN-based, NOT Supabase Auth.
 *      Cell number + 6-digit PIN verified against the taxis table
 *      using the DB function verify_pin().
 *
 *  • Passengers  →  Anonymous (no login required).
 *
 * Provides:
 *   session   – raw Supabase session object (null if not logged in)
 *   profile   – { id, full_name, cell_number, role, ... } from public.users
 *   driver    – { id, registration_number, driver_name, ... } from taxis (drivers only)
 *   loading   – true while session is being resolved on mount
 *   login(cellNumber, password)           – owner / marshal / admin sign-in
 *   loginDriver(driverCell, pin)          – driver PIN sign-in
 *   register(fullName, cellNumber, password, role) – new account creation
 *   logout()                              – sign out
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

// ── Internal helper: convert cell number → internal email ────────────────────
const cellToEmail = (cellNumber) => `${cellNumber.trim()}@erank.app`;

// ── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [session, setSession]   = useState(null);
  const [profile, setProfile]   = useState(null); // public.users row
  const [driver,  setDriver]    = useState(null);  // taxis row (driver login only)
  const [loading, setLoading]   = useState(true);

  // ── Fetch the public.users profile for a given auth user id ────────────────
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[AuthContext] fetchProfile error:', error.message);
      return null;
    }
    return data;
  };

  // ── On mount: restore existing session ────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        const p = await fetchProfile(s.user.id);
        setProfile(p);
      }
      setLoading(false);
    });

    // Listen for future auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        if (s?.user) {
          const p = await fetchProfile(s.user.id);
          setProfile(p);
        } else {
          setProfile(null);
          setDriver(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── login: Owner / Marshal / Admin ────────────────────────────────────────
  /**
   * Sign in using cell number + password.
   * @returns {string} role – 'owner' | 'marshal' | 'admin'
   * @throws  {Error}  on wrong credentials or account not found in public.users
   */
  const login = async (cellNumber, password) => {
    const email = cellToEmail(cellNumber);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    // Fetch role from public.users
    const p = await fetchProfile(data.user.id);
    if (!p) {
      await supabase.auth.signOut();
      throw new Error('User profile not found. Contact your administrator.');
    }

    setProfile(p);
    return p.role; // caller uses this to navigate to the correct dashboard
  };

  // ── loginDriver: Driver PIN auth ──────────────────────────────────────────
  /**
   * Verify a driver by cell number + PIN against the taxis table.
   * Drivers are NOT Supabase Auth users – their PIN hash lives in taxis.driver_pin_hash.
   * @returns {object} taxi – the matched taxis row
   * @throws  {Error}  on wrong cell / PIN or no taxi found
   */
  const loginDriver = async (driverCell, pin) => {
    // 1. Find the taxi by driver cell number
    const { data: taxi, error: taxiError } = await supabase
      .from('taxis')
      .select('*')
      .eq('driver_cell', driverCell.trim())
      .single();

    if (taxiError || !taxi) {
      throw new Error('No taxi found for this cell number.');
    }

    // 2. Verify PIN using the DB function verify_pin(plain_pin, stored_hash)
    const { data: isValid, error: pinError } = await supabase
      .rpc('verify_pin', {
        plain_pin:   pin.trim(),
        stored_hash: taxi.driver_pin_hash,
      });

    if (pinError) throw new Error(pinError.message);
    if (!isValid) throw new Error('Incorrect PIN. Please try again.');

    setDriver(taxi);
    return taxi;
  };

  // ── register: Owner / Marshal / Admin ─────────────────────────────────────
  /**
   * Create a new Supabase Auth user and a matching public.users row.
   * @param {string} fullName
   * @param {string} cellNumber – SA format, e.g. 0821234567
   * @param {string} password
   * @param {string} role       – 'owner' | 'marshal' | 'admin'
   */
  const register = async (fullName, cellNumber, password, role) => {
    const email = cellToEmail(cellNumber);

    // Create auth user
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);

    // Insert into public.users (links via auth.users id)
    const { error: insertError } = await supabase.from('users').insert({
      id:          data.user.id,
      full_name:   fullName.trim(),
      cell_number: cellNumber.trim(),
      email:       email,
      role:        role.toLowerCase(),
    });

    if (insertError) {
      // Roll back auth user creation on failure
      await supabase.auth.admin?.deleteUser?.(data.user.id);
      throw new Error(insertError.message);
    }
  };

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setDriver(null);
  };

  // ── Context value ─────────────────────────────────────────────────────────
  return (
    <AuthContext.Provider
      value={{ session, profile, driver, loading, login, loginDriver, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
