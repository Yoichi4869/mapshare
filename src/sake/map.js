import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { MAP_DEFAULT, TILE } from "./constants.js";
import { openDetailModal } from "./utils.js";

let map;
let markers;

function getSeishuClass(seishu) {
  switch (seishu) {
    case "junmai":
      return "pin-junmai";
    case "ginjo":
      return "pin-ginjo";
    case "honjozo":
      return "pin-honjozo";
    default:
      return "pin-default";
  }
}

function createColoredIcon(seishu) {
  const colorClass = getSeishuClass(seishu);

  return L.divIcon({
    className: "custom-pin-wrapper",
    html: `<div class="custom-pin ${colorClass}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10]
  });
}

export function initMap() {
  map = L.map("map", { zoomControl: false }).setView(
    MAP_DEFAULT.center,
    MAP_DEFAULT.zoom
  );

  // ズームを右下
  L.control.zoom({ position: "bottomright" }).addTo(map);

  // 現在地ボタン
  const locateButton = L.control({ position: "bottomright" });
  locateButton.onAdd = function () {
    const div = L.DomUtil.create("div", "locate-btn");
    div.innerHTML = "➤";
    div.onclick = function () {
      map.locate({ setView: true, maxZoom: 14 });
    };
    return div;
  };
  locateButton.addTo(map);

  // タイル
  L.tileLayer(TILE.url, TILE.options).addTo(map);

  // クラスタ
  markers = L.markerClusterGroup();
  map.addLayer(markers);

  // 現在地取得
  map.on("locationfound", function (e) {
    L.circleMarker(e.latlng, { radius: 8, color: "blue" })
      .addTo(map)
      .bindPopup("現在地")
      .openPopup();
  });

  map.on("locationerror", function () {
    alert("現在地を取得できませんでした");
  });

  map.whenReady(() => {
    map.invalidateSize();
    setTimeout(() => map.invalidateSize(), 200);
    setTimeout(() => map.invalidateSize(), 800);
  });

  return map;
}

export function renderMarkers(spots) {
  if (!markers) return;

  markers.clearLayers();

  spots.forEach((sake) => {
    const marker = L.marker([sake.lat, sake.lng], {
      icon: createColoredIcon(sake.seishu)
    });

    marker.on("click", () => {
      openDetailModal(sake);
    });

    markers.addLayer(marker);
  });
}

let pickMode = false;

export function enablePickMode(onPicked) {
  pickMode = true;
  map.once("click", (e) => {
    pickMode = false;
    onPicked?.(e.latlng);
  });
}

export function invalidateMapSize() {
  if (!map) return;
  map.invalidateSize();
}