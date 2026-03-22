export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function toast(message, ms = 2400) {
  const el = qs("#toast");
  if (!el) return;

  el.textContent = message;
  el.hidden = false;
  el.classList.add("show");

  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.classList.remove("show");
    el.hidden = true;
  }, ms);
}

export function askSpotByPrompt() {
  const name = prompt("名前（酒蔵/お店）を入力");
  if (!name) return null;

  const pref = prompt("都道府県（例：広島県）") ?? "";
  const lat = Number(prompt("緯度（例：35.6812）"));
  const lng = Number(prompt("経度（例：139.7671）"));
  const desc = prompt("説明（任意）") ?? "";

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    alert("緯度経度が数字ではありません");
    return null;
  }

  return { name, pref, lat, lng, desc };
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[s]));
}

export function openModal(initial = {}) {
  const overlay = qs("#modalOverlay");
  const form = qs("#formSubmit");
  if (!overlay || !form) return;

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");

  // 初期値セット
  form.name.value = initial.name ?? "";
  form.taste.value = initial.taste ?? "";
  form.seishu.value = initial.seishu ?? "";
  if (form.items) form.items.value = initial.items ?? "";
  if (form.price) form.price.value = initial.price ?? "";
  if (form.website) form.website.value = initial.website ?? "";
  form.lat.value = initial.lat ?? "";
  form.lng.value = initial.lng ?? "";
  form.desc.value = initial.desc ?? "";

  // フォーカス
  setTimeout(() => form.name.focus(), 0);
}

export function closeModal() {
  const overlay = qs("#modalOverlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}

export function readModalForm() {
  const form = qs("#formSubmit");
  if (!form) return null;

  const name = String(form.name.value || "").trim();
  const taste = String(form.taste.value || "").trim();
  const seishu = String(form.seishu.value || "").trim();

  const lat = Number(form.lat.value);
  const lng = Number(form.lng.value);

  const items = form.items ? String(form.items.value || "").trim() : "";
  const priceRaw = form.price ? String(form.price.value || "").trim() : "";
  const price = priceRaw ? Number(priceRaw) : null;

  const websiteRaw = form.website ? String(form.website.value || "").trim() : "";
  const desc = String(form.desc.value || "").trim();

  let website = null;
  if (websiteRaw) {
    try {
      new URL(websiteRaw);
      website = websiteRaw;
    } catch {
      throw new Error("URLの形式が正しくありません");
    }
  }

  if (!name) throw new Error("場所名は必須です");
  if (!seishu) throw new Error("清酒区分を選択してください");
  if (!taste) throw new Error("種類を選択してください");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("緯度/経度が不正です");
  }
  if (priceRaw && !Number.isFinite(price)) {
    throw new Error("価格が不正です");
  }

  return {
    name,
    taste,
    seishu,
    items: items || null,
    price,
    lat,
    lng,
    website,
    desc: desc || null
  };
}

function tasteLabel(taste) {
  switch (taste) {
    case "dry": return "辛口傾向";
    case "sweet": return "甘口傾向";
    case "fruity": return "フルーティー";
    case "rich": return "濃醇";
    case "light": return "淡麗";
    default: return "-";
  }
}

function seishuLabel(seishu) {
  switch (seishu) {
    case "junmai": return "純米酒";
    case "ginjo": return "吟醸酒";
    case "honjozo": return "本醸造酒";
    default: return "-";
  }
}

export function openDetailModal(spot) {
  const overlay = qs("#detailOverlay");
  if (!overlay) return;

  const nameEl = qs("#detailName");
  const tasteEl = qs("#detailTaste");
  const seishuEl = qs("#detailSeishu");
  const priceEl = qs("#detailPrice");
  const latLngEl = qs("#detailLatLng");
  const descEl = qs("#detailDesc");
  const mapLink = qs("#detailMapLink");
  const websiteLink = qs("#detailWebsiteLink");

  if (nameEl) nameEl.textContent = spot.name ?? "-";
  if (tasteEl) tasteEl.textContent = tasteLabel(spot.taste);
  if (seishuEl) seishuEl.textContent = seishuLabel(spot.seishu);
  if (priceEl) priceEl.textContent = spot.price ? `${spot.price}円` : "-";
  if (latLngEl) latLngEl.textContent = `緯度: ${spot.lat}, 経度: ${spot.lng}`;
  if (descEl) descEl.textContent = spot.description ?? "-";

  if (mapLink) {
    mapLink.href = `https://www.google.com/maps?q=${spot.lat},${spot.lng}`;
  }

  if (websiteLink) {
    if (spot.website) {
      websiteLink.href = spot.website;
      websiteLink.classList.remove("hidden");
    } else {
      websiteLink.classList.add("hidden");
    }
  }

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
}

export function closeDetailModal() {
  const overlay = qs("#detailOverlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}