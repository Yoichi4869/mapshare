import { supabase } from '../shared/supabase.js';
import { TABLE } from './constants.js';

export async function fetchApprovedSpots() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id,name,pref,lat,lng,description")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function submitSpot({ name, pref, lat, lng, description }) {
  const { error } = await supabase
    .from(TABLE)
    .insert([{ name, pref, lat, lng, description, status: "pending" }]);

  if (error) throw error;
}
