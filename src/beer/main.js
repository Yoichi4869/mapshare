import { CONFIG } from './constants.js';
import {
    showToast,
    showLoading,
    hideLoading,
    openModal,
    closeModal,
    resetForm,
    toggleFilter,
    setFillHeight
} from './utils.js';
import {
    fetchLocations,
    fetchLocationById,
    addLocation,
    updateLocation,
    incrementReportCount
} from './api.js';
import {
    initMap,
    setMapClickHandler,
    setMapMoveEndHandler,
    displayLocationsOnMap,
    startMapSelection,
    endMapSelection,
    handleLocateBtn,
    focusOnMap,
    getCurrentLocation,
    getLocationsInView,
    map,
    selectionState
} from './map.js';

let allLocations = [];
let isListCollapsed = true;

document.addEventListener('DOMContentLoaded', () => {
    setupGlobalFunctions();
    initMap();
    initEventListeners();
    loadLocations();
    setFillHeight();
});

function setupGlobalFunctions() {
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.showToast = showToast;
    window.showLoading = showLoading;
    window.hideLoading = hideLoading;
    window.focusOnMap = focusOnMap;
    window.showDetail = showDetail;
    window.openEditModal = openEditModal;
    window.openHelpModal = openHelpModal;
    window.closeHelpModal = closeHelpModal;
    window.reportLocation = reportLocation;
}

function initEventListeners() {
    const listeners = {
        'addLocationBtn': openAddModal,
        'closeModalBtn': closeAddModal,
        'cancelBtn': closeAddModal,
        'closeDetailBtn': () => closeModal('detailModal'),
        'selectFromMapBtn': () => startMapSelection(),
        'addLocationForm': handleSubmit,
        'getCurrentLocation': () => getCurrentLocation(),
        'filterToggle': toggleFilter,
        'applyFilter': applyFilter,
        'clearFilter': clearFilter,
        'helpBtn': openHelpModal,
        'refreshBtn': () => loadLocations(),
        'locateBtn': () => handleLocateBtn()
    };

    Object.entries(listeners).forEach(([id, handler]) => {
        const el = document.getElementById(id);
        if (el) {
            const event = id.includes('Form') ? 'submit' : 'click';
            el.addEventListener(event, handler);
        }
    });

    // リスト開閉
    const listHeader = document.querySelector('.list-header');
    listHeader?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleList();
    });

    // モーダル外クリックで閉じる
    window.addEventListener('click', (e) => {
        if (e.target.id === 'addModal') closeAddModal();
        if (e.target.id === 'detailModal') closeModal('detailModal');
        if (e.target.id === 'helpModal') closeHelpModal();
    });

    setMapClickHandler(handleMapClick);
    setMapMoveEndHandler(updateListFromMap);

    window.addEventListener('resize', setFillHeight);
}

async function handleMapClick(e) {
    if (!selectionState.isSelecting) return;

    document.getElementById('latitude').value = e.latlng.lat.toFixed(6);
    document.getElementById('longitude').value = e.latlng.lng.toFixed(6);

    endMapSelection();
    openModal('addModal');
    showToast(`座標（${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}）を取得しました`, 'success');
}

async function loadLocations(filters = {}, preventReset = false) {
    showLoading();
    try {
        const result = await fetchLocations(filters);
        allLocations = result || [];

        let filtered = allLocations;
        if (filters.beerType) {
            filtered = filtered.filter(loc =>
                loc.beer_type?.toLowerCase() === filters.beerType.toLowerCase()
            );
        }

        displayLocationsOnMap(filtered, preventReset);
        updateListFromMap();
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        showToast('データの読み込みに失敗しました', 'error');
    } finally {
        hideLoading();
    }
}

function updateListFromMap() {
    const visibleLocations = getLocationsInView(allLocations);
    const listContent = document.getElementById('listContent');
    const listHeader = document.querySelector('.list-header h2');

    if (listHeader) {
        listHeader.innerHTML = `<i class="fas fa-list"></i> 表示中の場所 (${visibleLocations.length})`;
    }

    if (visibleLocations.length === 0) {
        listContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-map-marked-alt"></i>
                <p>この範囲にビール場所はありません</p>
            </div>
        `;
        return;
    }

    listContent.innerHTML = visibleLocations.map(loc => `
        <div class="location-card" onclick="window.showDetail('${loc.id}')">
            <div class="location-card-header">
                <div class="location-card-title">${loc.location_name || '名称未設定'}</div>
            </div>
            <div class="location-card-info">
                <p><i class="fas fa-beer"></i> ${loc.place_type === 'brewery' ? '醸造所' : loc.place_type === 'bar' ? 'ビアバー' : '専門店'}</p>
                <p><i class="fas fa-tag"></i> ${loc.beer_type || '未設定'}</p>
                ${loc.price ? `<p><i class="fas fa-yen-sign"></i> ${loc.price}円</p>` : ''}
            </div>
        </div>
    `).join('');
}

function toggleList() {
    const listPanel = document.getElementById('listPanel');
    isListCollapsed = !isListCollapsed;
    listPanel.classList.toggle('collapsed', isListCollapsed);
}

function openAddModal() {
    resetForm('addLocationForm');
    document.getElementById('editId').value = '';
    const modalHeader = document.querySelector('#addModal .modal-header h2');
    const submitBtn = document.querySelector('#addModal button[type="submit"]');
    if (modalHeader) modalHeader.innerHTML = '<i class="fas fa-plus-circle"></i> ビール場所の登録';
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> 登録';
    openModal('addModal');
}

function closeAddModal() {
    closeModal('addModal');
    resetForm('addLocationForm');
    document.getElementById('editId').value = '';
    const modalHeader = document.querySelector('#addModal .modal-header h2');
    const submitBtn = document.querySelector('#addModal button[type="submit"]');
    if (modalHeader) modalHeader.innerHTML = '<i class="fas fa-plus-circle"></i> ビール場所の登録';
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> 登録';
}

function openHelpModal() {
    openModal('helpModal');
}

function closeHelpModal() {
    closeModal('helpModal');
}

async function showDetail(id) {
    showLoading();
    try {
        const location = await fetchLocationById(id);
        if (!location) throw new Error('Not found');

        const lastUpdate = location.updated_at
            ? new Date(location.updated_at).toLocaleDateString('ja-JP', {
                year: 'numeric', month: '2-digit', day: '2-digit'
            }) : '不明';

        const placeTypeMap = { brewery: '醸造所', bar: 'ビアバー', shop: '専門店' };
        const beerTypeMap = { ipa: 'IPA', stout: 'スタウト', lager: 'ラガー', wheat: 'ヴァイツェン', pale_ale: 'ペールエール', porter: 'ポーター', sour: 'サワー', other: 'その他' };

        const detailContent = document.getElementById('detailContent');
        detailContent.innerHTML = `
            <div class="detail-section">
                <h3><i class="fas fa-store"></i> 場所名</h3>
                <p>${location.location_name || '未設定'}</p>
            </div>
            <div class="detail-section">
                <h3><i class="fas fa-beer"></i> 種別</h3>
                <p>${placeTypeMap[location.place_type] || location.place_type || '未設定'}</p>
            </div>
            <div class="detail-section">
                <h3><i class="fas fa-tag"></i> ビールスタイル</h3>
                <p>${beerTypeMap[location.beer_type] || location.beer_type || '未設定'}</p>
            </div>
            ${location.price ? `
            <div class="detail-section">
                <h3><i class="fas fa-yen-sign"></i> 価格</h3>
                <p>${location.price}円</p>
            </div>` : ''}
            <div class="detail-section">
                <h3><i class="fas fa-map"></i> 位置情報</h3>
                <p>緯度: ${location.latitude}, 経度: ${location.longitude}</p>
            </div>
            ${location.notes ? `
            <div class="detail-section">
                <h3><i class="fas fa-sticky-note"></i> 備考</h3>
                <p style="white-space: pre-wrap;">${location.notes}</p>
            </div>` : ''}
            <div class="detail-section detail-actions">
                <button class="btn btn-primary" onclick="window.focusOnMap(${location.latitude}, ${location.longitude}); window.closeModal('detailModal'); document.getElementById('listPanel').classList.add('collapsed');">
                    <i class="fas fa-map-marked-alt"></i> 地図
                </button>
                <a href="https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}" target="_blank" class="btn btn-outline" style="margin-left: 10px;">
                    <i class="fab fa-google"></i> Googleマップで開く
                </a>
                ${location.website ? `
                <a href="${location.website}" target="_blank" class="btn btn-outline" style="margin-left: 10px;">
                    <i class="fas fa-external-link-alt"></i> 公式サイト
                </a>` : ''}
                <button class="btn btn-secondary" onclick="window.openEditModal('${location.id}')">
                    <i class="fas fa-edit"></i> 編集
                </button>
            </div>
            <div class="detail-section last-update-row" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                <div>
                    <h3><i class="fas fa-history"></i> 最終更新日</h3>
                    <p>${lastUpdate}</p>
                </div>
                <button onclick="window.reportLocation('${location.id}')"
                        style="background: none !important; border: none !important; box-shadow: none !important; padding: 0 !important; cursor: pointer; margin-left: auto;">
                    <i class="fas fa-flag" style="font-size: 1.5rem !important; color: #E65100 !important;"></i> 通報
                </button>
            </div>
        `;

        openModal('detailModal');
    } catch (error) {
        console.error('詳細取得エラー:', error);
        showToast('詳細情報の取得に失敗しました', 'error');
    } finally {
        hideLoading();
    }
}

function getFormData() {
    return {
        location_name: document.getElementById('locationName').value.trim(),
        place_type: document.getElementById('placeType').value.trim(),
        beer_type: document.getElementById('beerType').value.trim(),
        price: document.getElementById('price').value.trim() || null,
        latitude: parseFloat(document.getElementById('latitude').value),
        longitude: parseFloat(document.getElementById('longitude').value),
        notes: document.getElementById('notes').value.trim(),
        website: document.getElementById('website').value.trim() || null
    };
}

function validateFormData(data) {
    if (!data.location_name) return { valid: false, message: '場所名を入力してください' };
    if (!data.place_type)    return { valid: false, message: '種別を選択してください' };
    if (!data.beer_type)     return { valid: false, message: 'ビールスタイルを選択してください' };
    if (isNaN(data.latitude) || isNaN(data.longitude)) return { valid: false, message: '有効な座標を入力してください' };
    return { valid: true };
}

async function handleSubmit(e) {
    e.preventDefault();

    const editId = document.getElementById('editId').value;
    const formData = getFormData();
    const validation = validateFormData(formData);

    if (!validation.valid) {
        showToast(validation.message, 'error');
        return;
    }

    showLoading();
    try {
        if (editId) {
            await updateLocation(editId, { ...formData, updated_at: new Date().toISOString() });
            showToast('更新が完了しました！', 'success');
        } else {
            await addLocation(formData);
            showToast('登録が完了しました！', 'success');
        }
        closeAddModal();
        await loadLocations({}, true);
    } catch (error) {
        console.error('保存エラー:', error);
        showToast('保存に失敗しました', 'error');
    } finally {
        hideLoading();
    }
}

async function openEditModal(id) {
    closeModal('detailModal');
    showLoading();
    try {
        const location = await fetchLocationById(id);
        if (!location) throw new Error('Not found');

        document.getElementById('editId').value = id;
        document.getElementById('locationName').value = location.location_name || '';
        document.getElementById('placeType').value = location.place_type || '';
        document.getElementById('beerType').value = location.beer_type || '';
        document.getElementById('price').value = location.price || '';
        document.getElementById('latitude').value = location.latitude || '';
        document.getElementById('longitude').value = location.longitude || '';
        document.getElementById('notes').value = location.notes || '';
        document.getElementById('website').value = location.website || '';

        const modalHeader = document.querySelector('#addModal .modal-header h2');
        const submitBtn = document.querySelector('#addModal button[type="submit"]');
        if (modalHeader) modalHeader.innerHTML = '<i class="fas fa-edit"></i> ビール場所の編集';
        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> 更新';

        openModal('addModal');
    } catch (error) {
        console.error('編集データ取得エラー:', error);
        showToast('データの取得に失敗しました', 'error');
    } finally {
        hideLoading();
    }
}

async function applyFilter() {
    const beerType = document.getElementById('beerTypeFilter').value.trim();
    const search = document.getElementById('searchQuery').value.trim();
    await loadLocations({ beerType, search }, true);
    showToast('フィルターを適用しました', 'success');
}

async function clearFilter() {
    document.getElementById('beerTypeFilter').value = '';
    document.getElementById('searchQuery').value = '';
    await loadLocations({}, true);
    showToast('フィルターをクリアしました', 'info');
}

async function reportLocation(id) {
    if (!confirm('この場所を通報しますか？\n（不適切な情報や虚偽の情報の場合のみ通報してください）')) return;

    showLoading();
    try {
        const location = await fetchLocationById(id);
        const currentCount = location.report_count || 0;
        await incrementReportCount(id, currentCount);
        showToast('通報を受け付けました', 'success');
        closeModal('detailModal');
        await loadLocations({}, true);
    } catch (error) {
        console.error('通報エラー:', error);
        showToast('通報に失敗しました', 'error');
    } finally {
        hideLoading();
    }
}
