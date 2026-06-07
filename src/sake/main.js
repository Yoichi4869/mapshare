import {
    showToast,
    showLoading,
    hideLoading,
    openModal,
    closeModal,
    resetForm,
    toggleFilter,
    setFillHeight,
    escapeHtml
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

    const listHeader = document.querySelector('.list-header');
    listHeader?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleList();
    });

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
        if (filters.sakeType) {
            filtered = filtered.filter(loc =>
                loc.sake_type?.toLowerCase() === filters.sakeType.toLowerCase()
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

function sakeTypeLabel(type) {
    const labels = {
        junmai_daiginjo: '純米大吟醸',
        daiginjo: '大吟醸',
        junmai_ginjo: '純米吟醸',
        ginjo: '吟醸',
        junmai: '純米',
        honjozo: '本醸造',
        other: 'その他'
    };
    return labels[type] || type || '未設定';
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
                <p>この範囲に酒蔵はありません</p>
            </div>
        `;
        return;
    }

    listContent.innerHTML = visibleLocations.map(loc => `
        <div class="location-card" onclick="window.showDetail('${escapeHtml(loc.id)}')">
            <div class="location-card-header">
                <div class="location-card-title">${escapeHtml(loc.location_name) || '名称未設定'}</div>
            </div>
            <div class="location-card-info">
                <p><i class="fas fa-wine-bottle"></i> ${escapeHtml(sakeTypeLabel(loc.sake_type))}</p>
                ${loc.price ? `<p><i class="fas fa-yen-sign"></i> ${escapeHtml(String(loc.price))}円</p>` : ''}
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
    if (modalHeader) modalHeader.innerHTML = '<i class="fas fa-plus-circle"></i> 酒蔵の登録';
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> 登録';
    openModal('addModal');
}

function closeAddModal() {
    closeModal('addModal');
    resetForm('addLocationForm');
    document.getElementById('editId').value = '';
    const modalHeader = document.querySelector('#addModal .modal-header h2');
    const submitBtn = document.querySelector('#addModal button[type="submit"]');
    if (modalHeader) modalHeader.innerHTML = '<i class="fas fa-plus-circle"></i> 酒蔵の登録';
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> 登録';
}

function openHelpModal() { openModal('helpModal'); }
function closeHelpModal() { closeModal('helpModal'); }

async function showDetail(id) {
    showLoading();
    try {
        const location = await fetchLocationById(id);
        if (!location) throw new Error('Not found');

        const lastUpdate = location.updated_at
            ? new Date(location.updated_at).toLocaleDateString('ja-JP', {
                year: 'numeric', month: '2-digit', day: '2-digit'
            }) : '不明';

        const detailContent = document.getElementById('detailContent');
        const lat = parseFloat(location.latitude);
        const lng = parseFloat(location.longitude);
        const safeId = escapeHtml(String(location.id));

        detailContent.innerHTML = `
            <div class="detail-section">
                <h3><i class="fas fa-store"></i> 酒蔵名</h3>
                <p>${escapeHtml(location.location_name) || '未設定'}</p>
            </div>
            <div class="detail-section">
                <h3><i class="fas fa-wine-bottle"></i> 日本酒の種類</h3>
                <p>${escapeHtml(sakeTypeLabel(location.sake_type))}</p>
            </div>
            ${location.price ? `
            <div class="detail-section">
                <h3><i class="fas fa-yen-sign"></i> 価格</h3>
                <p>${escapeHtml(String(location.price))}円</p>
            </div>` : ''}
            <div class="detail-section">
                <h3><i class="fas fa-map"></i> 位置情報</h3>
                <p>緯度: ${lat}, 経度: ${lng}</p>
            </div>
            ${location.notes ? `
            <div class="detail-section">
                <h3><i class="fas fa-sticky-note"></i> 備考</h3>
                <p style="white-space: pre-wrap;">${escapeHtml(location.notes)}</p>
            </div>` : ''}
            <div class="detail-section detail-actions">
                <button class="btn btn-primary" onclick="window.focusOnMap(${lat}, ${lng}); window.closeModal('detailModal'); document.getElementById('listPanel').classList.add('collapsed');">
                    <i class="fas fa-map-marked-alt"></i> 地図
                </button>
                <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" class="btn btn-outline" style="margin-left: 10px;">
                    <i class="fab fa-google"></i> Googleマップで開く
                </a>
                <button class="btn btn-secondary" onclick="window.openEditModal('${safeId}')">
                    <i class="fas fa-edit"></i> 編集
                </button>
            </div>
            <div class="detail-section last-update-row" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                <div>
                    <h3><i class="fas fa-history"></i> 最終更新日</h3>
                    <p>${escapeHtml(lastUpdate)}</p>
                </div>
                <button onclick="window.reportLocation('${safeId}')"
                        style="background: none !important; border: none !important; box-shadow: none !important; padding: 0 !important; cursor: pointer; margin-left: auto;">
                    <i class="fas fa-flag" style="font-size: 1.5rem !important; color: #1565C0 !important;"></i> 通報
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
        sake_type: document.getElementById('sakeType').value.trim(),
        price: document.getElementById('price').value.trim() || null,
        latitude: parseFloat(document.getElementById('latitude').value),
        longitude: parseFloat(document.getElementById('longitude').value),
        notes: document.getElementById('notes').value.trim()
    };
}

function validateFormData(data) {
    if (!data.location_name) return { valid: false, message: '場所名を入力してください' };
    if (!data.sake_type)     return { valid: false, message: '日本酒の種類を選択してください' };
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
        document.getElementById('sakeType').value = location.sake_type || '';
        document.getElementById('price').value = location.price || '';
        document.getElementById('latitude').value = location.latitude || '';
        document.getElementById('longitude').value = location.longitude || '';
        document.getElementById('notes').value = location.notes || '';

        const modalHeader = document.querySelector('#addModal .modal-header h2');
        const submitBtn = document.querySelector('#addModal button[type="submit"]');
        if (modalHeader) modalHeader.innerHTML = '<i class="fas fa-edit"></i> 酒蔵の編集';
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
    const sakeType = document.getElementById('sakeTypeFilter').value.trim();
    const search = document.getElementById('searchQuery').value.trim();
    await loadLocations({ sakeType, search }, true);
    showToast('フィルターを適用しました', 'success');
}

async function clearFilter() {
    document.getElementById('sakeTypeFilter').value = '';
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
