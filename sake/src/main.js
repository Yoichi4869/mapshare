import "./style.css";
import {
  initMap,
  renderMarkers,
  enablePickMode,
  invalidateMapSize
} from "./map.js";
import {
  qs,
  toast,
  openModal,
  closeModal,
  readModalForm
} from "./utils.js";
import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  TABLE
} from "./constants.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function on(selector, event, handler) {
  const el = qs(selector);
  if (!el) {
    console.warn("Missing element:", selector, "\nstack:", new Error().stack);
    return;
  }
  el.addEventListener(event, handler);
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM ready:", {
    btnModalClose: !!document.querySelector("#btnModalClose"),
    btnCancelModal: !!document.querySelector("#btnCancelModal"),
    modalOverlay: !!document.querySelector("#modalOverlay"),
    formSubmit: !!document.querySelector("#formSubmit"),
  });

  initMap();

  // 初回表示後に地図サイズを再計算
  requestAnimationFrame(() => {
    invalidateMapSize();
  });

  window.addEventListener("load", () => {
    invalidateMapSize();
    setTimeout(invalidateMapSize, 100);
    setTimeout(invalidateMapSize, 300);
    setTimeout(invalidateMapSize, 800);
  });

  window.addEventListener("resize", () => {
    invalidateMapSize();
  });


  //supabase
  let spots = [];

async function refresh() {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    spots = data ?? [];
    renderMarkers(spots);
    toast(`表示：${spots.length}件`);
    invalidateMapSize();
  } catch (err) {
    console.error(err);
    toast("データの読み込みに失敗しました");
  }
}

  // 基本ボタン
  on("#btnReload", "click", refresh);
  on("#btnNew", "click", () => openModal());
  on("#btnHelp", "click", () => alert("ヘルプ"));

  // フィルター開閉
on("#btnFilter", "click", (e) => {
  e.stopPropagation();

  qs("#filterWrapper")?.classList.toggle("active");

  requestAnimationFrame(() => {
    invalidateMapSize();
  });

  setTimeout(invalidateMapSize, 100);
});

// フィルター外クリックで閉じる
document.addEventListener("click", (e) => {
  const wrapper = qs("#filterWrapper");
  if (!wrapper) return;

  // フィルター内をクリックした場合は閉じない
  if (wrapper.contains(e.target)) return;

  // 外をクリックしたら閉じる
  wrapper.classList.remove("active");
});

  on("#btnModalClose", "click", closeModal);
  on("#btnCancelModal", "click", closeModal);

  on("#modalOverlay", "click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
  });

  //詳細モーダル
  on("#btnDetailClose", "click", closeDetailModal);

  on("#detailOverlay", "click", (e) => {
    if (e.target.id === "detailOverlay") closeDetailModal();
  });

  // 地図から選択
  on("#btnPickFromMap", "click", () => {
    toast("地図をクリックして場所を選んでください");

    enablePickMode((latlng) => {
      const form = qs("#formSubmit");
      if (!form) return;

      form.lat.value = latlng.lat.toFixed(6);
      form.lng.value = latlng.lng.toFixed(6);
      toast("緯度経度を入力しました");
    });
  });

  // 現在地取得
  on("#btnUseCurrent", "click", () => {
    if (!navigator.geolocation) {
      toast("この端末では現在地取得が使えません");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const form = qs("#formSubmit");
        if (!form) return;

        form.lat.value = pos.coords.latitude.toFixed(6);
        form.lng.value = pos.coords.longitude.toFixed(6);
        toast("現在地を入力しました");
      },
      () => {
        toast("現在地を取得できませんでした");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });

  // 新規登録
  // 新規登録
on("#formSubmit", "submit", async (e) => {
  e.preventDefault();

  try {
    const payload = readModalForm();

    const { error } = await supabase.from(TABLE).insert([
      {
        name: payload.name,
        taste: payload.taste ?? "",
        seishu: payload.seishu ?? "",
        pref: payload.pref ?? "",
        lat: payload.lat,
        lng: payload.lng,
        price: payload.price ?? null,
        description: [
          payload.items ? `代表銘柄: ${payload.items}` : null,
          payload.desc ? payload.desc : null
        ].filter(Boolean).join(" / "),
        website: payload.website ?? null
      }
    ]);

    if (error) throw error;

    closeModal();
    await refresh();
    toast("登録しました（Supabase保存）");
  } catch (err) {
    console.error(err);
    toast(err.message || "登録に失敗しました");
  }
});

  // フィルター検索
  on("#btnSearch", "click", () => {
    const taste = qs("#filterTaste")?.value ?? "";
    const seishu = qs("#filterSeishu")?.value ?? "";
    const keyword = qs("#filterKeyword")?.value.trim().toLowerCase() ?? "";

    let result = [...spots];

    // 種類フィルター
    if (taste) {
      result = result.filter((s) => s.taste === taste);
    }

    // 清酒区分フィルター
    if (seishu) {
      result = result.filter((s) => s.seishu === seishu);
    }

    // キーワード検索（酒蔵名 or 都道府県）
    if (keyword) {
      result = result.filter((s) =>
        (s.name && s.name.toLowerCase().includes(keyword)) ||
        (s.pref && s.pref.toLowerCase().includes(keyword))
      );
    }

    if (result.length === 0) {
      toast("まだ登録されていません。");
    } else {
      toast(`検索結果：${result.length}件`);
    }

    renderMarkers(result);
    invalidateMapSize();
  });

  // フィルタークリア
  on("#btnClearFilter", "click", () => {
    const tasteEl = qs("#filterTaste");
    const seishuEl = qs("#filterSeishu");
    const keywordEl = qs("#filterKeyword");

    if (tasteEl) tasteEl.value = "";
    if (seishuEl) seishuEl.value = "";
    if (keywordEl) keywordEl.value = "";

    renderMarkers(spots);
    toast(`表示：${spots.length}件`);
    invalidateMapSize();
  });

  // 初回表示
  refresh();
});