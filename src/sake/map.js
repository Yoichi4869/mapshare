import { CONFIG, MAP_CONFIG, GEOLOCATION_OPTIONS, UI_CONFIG, ICONS } from './constants.js';
import { groupLocationsByCoords, createPopupContent, showToast } from './utils.js';

export let map = null;
export let markers = [];
export let markerClusterGroup = null;

export const selectionState = {
    isSelecting: false
};

export function initMap() {
    const bounds = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180));

    map = L.map('map', {
        worldCopyJump: false,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        zoomControl: false
    }).setView(CONFIG.DEFAULT_CENTER, CONFIG.DEFAULT_ZOOM);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer(MAP_CONFIG.TILE_URL, {
        attribution: MAP_CONFIG.ATTRIBUTION,
        maxZoom: MAP_CONFIG.MAX_ZOOM,
        noWrap: true
    }).addTo(map);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const { latitude, longitude } = pos.coords;
                map.setView([latitude, longitude], UI_CONFIG.INITIAL_ZOOM_WITH_LOCATION);

                L.marker([latitude, longitude], {
                    icon: L.divIcon({
                        className: 'current-location-marker',
                        html: `<div style="${ICONS.CURRENT_LOCATION_STYLE}"></div>`,
                        iconSize: [20, 20]
                    })
                }).addTo(map);
            },
            err => console.log('位置情報取得エラー:', err)
        );
    }

    return map;
}

export function setMapClickHandler(handler) {
    if (map) map.on('click', handler);
}

export function setMapMoveEndHandler(handler) {
    if (map) map.on('moveend', handler);
}

export function displayLocationsOnMap(locations, preventReset = false) {
    if (markerClusterGroup) {
        map.removeLayer(markerClusterGroup);
    }
    markers = [];

    markerClusterGroup = L.markerClusterGroup({
        maxClusterRadius: MAP_CONFIG.CLUSTER_RADIUS,
        disableClusteringAtZoom: MAP_CONFIG.CLUSTERING_ZOOM_THRESHOLD,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
    });

    const locationGroups = groupLocationsByCoords(locations);

    for (const key in locationGroups) {
        const group = locationGroups[key];
        const first = group[0];

        const marker = L.marker([first.latitude, first.longitude], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: ICONS.MARKER,
                iconSize: [40, 40]
            }),
            id: first.id
        });

        marker.bindPopup(createPopupContent(group));

        marker.on('click', function (e) {
            if (selectionState.isSelecting) {
                L.DomEvent.stopPropagation(e);
                const latlng = e.latlng;
                document.getElementById('latitude').value = latlng.lat.toFixed(6);
                document.getElementById('longitude').value = latlng.lng.toFixed(6);

                selectionState.isSelecting = false;
                document.body.classList.remove('selecting-mode');

                if (window.openModal) window.openModal('addModal');
                showToast(`座標（${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}）を取得しました`, 'success');
            }
        });

        markers.push(marker);
        markerClusterGroup.addLayer(marker);
    }

    map.addLayer(markerClusterGroup);

    if (!preventReset && markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

export function startMapSelection() {
    selectionState.isSelecting = true;
    document.body.classList.add('selecting-mode');

    if (window.closeModal) window.closeModal('addModal');
    showToast('地図上の場所をクリックしてください', 'info');
}

export function endMapSelection() {
    selectionState.isSelecting = false;
    document.body.classList.remove('selecting-mode');
}

export function handleLocateBtn() {
    if (!navigator.geolocation) {
        showToast('位置情報に対応していません', 'error');
        return;
    }

    if (window.showLoading) window.showLoading();

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            map.setView([latitude, longitude], UI_CONFIG.LOCATE_ZOOM);
            if (window.hideLoading) window.hideLoading();
            showToast('現在地を取得しました');
        },
        (error) => {
            if (window.hideLoading) window.hideLoading();
            showToast('取得失敗: ' + error.message, 'error');
        },
        GEOLOCATION_OPTIONS
    );
}

export function focusOnMap(lat, lng) {
    if (map) map.setView([lat, lng], 15);
}

export function getCurrentLocation() {
    if (!navigator.geolocation) {
        showToast('位置情報に対応していません', 'error');
        return;
    }

    if (window.showLoading) window.showLoading();

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            document.getElementById('latitude').value = latitude.toFixed(6);
            document.getElementById('longitude').value = longitude.toFixed(6);
            if (window.hideLoading) window.hideLoading();
            showToast('現在地を取得しました', 'success');
        },
        (error) => {
            if (window.hideLoading) window.hideLoading();
            showToast('位置情報の取得に失敗しました', 'error');
        },
        GEOLOCATION_OPTIONS
    );
}

export function getLocationsInView(allLocations) {
    if (!map) return [];
    const bounds = map.getBounds();
    return allLocations.filter(loc => bounds.contains([loc.latitude, loc.longitude]));
}
