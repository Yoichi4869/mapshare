export const CONFIG = {
    TABLE_NAME: 'sake_locations',
    DEFAULT_CENTER: [36.5, 138.0],
    DEFAULT_ZOOM: 6,
    REPORT_THRESHOLD: 20
};

export const MAP_CONFIG = {
    TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ATTRIBUTION: '© OpenStreetMap contributors',
    MAX_ZOOM: 19,
    CLUSTER_RADIUS: 40,
    CLUSTERING_ZOOM_THRESHOLD: 16
};

export const GEOLOCATION_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};

export const UI_CONFIG = {
    TOAST_DURATION: 3000,
    INITIAL_ZOOM_WITH_LOCATION: 12,
    LOCATE_ZOOM: 15
};

export const ICONS = {
    MARKER: '<i class="fas fa-wine-bottle"></i>',
    CURRENT_LOCATION_STYLE: 'background: #2196F3; border: 3px solid white; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);'
};
