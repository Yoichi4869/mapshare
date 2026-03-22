export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const TABLE = "spots"; // 今の実装に合わせて spots のまま

export const MAP_DEFAULT = {
  center: [36, 138],
  zoom: 5
};

export const MAP_OPTIONS = {
  zoomControl: false
};

export const TILE = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  options: { attribution: "© OpenStreetMap contributors" }
};
