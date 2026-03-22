import { supabase } from '../shared/supabase.js';
import { CONFIG } from './constants.js';

const TABLE = CONFIG.TABLE_NAME;

export async function fetchLocations(filters = {}) {
    let query = supabase
        .from(TABLE)
        .select('*')
        .lt('report_count', CONFIG.REPORT_THRESHOLD);

    if (filters.search) {
        query = query.ilike('location_name', `*${filters.search}*`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
}

export async function fetchLocationById(id) {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function addLocation(locationData) {
    const { error } = await supabase
        .from(TABLE)
        .insert([locationData]);

    if (error) throw error;
}

export async function updateLocation(id, updates) {
    const { error } = await supabase
        .from(TABLE)
        .update(updates)
        .eq('id', id);

    if (error) throw error;
}

export async function deleteLocation(id) {
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function incrementReportCount(id, currentCount) {
    return await updateLocation(id, { report_count: currentCount + 1 });
}

export async function searchAddress(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=jp&limit=5`;

    const response = await fetch(url, {
        headers: { 'User-Agent': 'FirewoodMapApp/1.0' }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
}

export async function pingKeepalive() {
    const { error } = await supabase
        .from('keepalive')
        .upsert([{ id: 1, updated_at: new Date().toISOString() }]);

    if (error) console.warn('Keepalive ping failed:', error.message);
}

export async function sendContact(contactData) {
    const { error } = await supabase
        .from('contacts')
        .insert([contactData]);

    if (error) throw error;
}
