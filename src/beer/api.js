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
