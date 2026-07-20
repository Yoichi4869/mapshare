import { UI_CONFIG } from './constants.js';

/**
 * HTML特殊文字をエスケープ（テキスト・属性値のXSS対策）
 */
export function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, s => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
}

/**
 * インラインonclickのJS文字列引数向けエスケープ（HTML属性/JS文字列の両コンテキストで安全）
 */
export function escapeJsArg(str) {
    return String(str ?? '').replace(/[^\w .,:/-]/g, c => {
        const code = c.charCodeAt(0);
        return code <= 0xff
            ? '\\x' + code.toString(16).padStart(2, '0')
            : '\\u' + code.toString(16).padStart(4, '0');
    });
}

/**
 * http(s) 以外のスキーム（javascript: 等）を弾いてリンクのXSSを防ぐ
 */
export function safeUrl(url) {
    const u = String(url ?? '').trim();
    return /^https?:\/\//i.test(u) ? u : '';
}

export function groupLocationsByCoords(locations) {
    const groups = {};
    locations.forEach(loc => {
        const key = `${loc.latitude},${loc.longitude}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(loc);
    });
    return groups;
}

export function beerTypeLabel(type) {
    switch (type) {
        case 'ipa':      return 'IPA';
        case 'stout':    return 'スタウト';
        case 'lager':    return 'ラガー';
        case 'wheat':    return 'ヴァイツェン';
        case 'pale_ale': return 'ペールエール';
        case 'porter':   return 'ポーター';
        case 'sour':     return 'サワー';
        case 'other':    return 'その他';
        default:         return type || '未設定';
    }
}

export function placeTypeLabel(type) {
    switch (type) {
        case 'brewery': return '醸造所';
        case 'bar':     return 'ビアバー';
        case 'shop':    return '専門店';
        default:        return type || '未設定';
    }
}

export function createPopupContent(locations) {
    let html = '<div style="max-height: 300px; overflow-y: auto; min-width: 250px;">';

    if (locations.length > 0) {
        const firstLoc = locations[0];
        html += `
            <div style="text-align: center; margin-bottom: 0.8rem; padding-bottom: 0.8rem; border-bottom: 2px solid #E65100;">
                <h3 style="margin: 0 0 0.6rem 0; color: #E65100; font-size: 1.1rem; font-weight: bold;">${escapeHtml(firstLoc.location_name) || '名称未設定'}</h3>
            </div>
        `;
    }

    locations.forEach((loc, index) => {
        html += `
            <div style="${index > 0 ? 'margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ccc;' : ''}">
                <p style="margin: 0.2rem 0; font-size: 0.9rem;"><strong>🍺 種別:</strong> ${escapeHtml(placeTypeLabel(loc.place_type))}</p>
                <p style="margin: 0.2rem 0; font-size: 0.9rem;"><strong>🎨 スタイル:</strong> ${escapeHtml(beerTypeLabel(loc.beer_type))}</p>
                ${loc.price ? `<p style="margin: 0.2rem 0; font-size: 0.9rem;"><strong>💰 価格:</strong> ${escapeHtml(loc.price)}円</p>` : ''}
                ${loc.notes ? `<p style="margin: 0.2rem 0; font-size: 0.85rem; color: #666;"><strong>📝 備考:</strong> ${escapeHtml(loc.notes)}</p>` : ''}
                <button
                    onclick="window.showDetail('${escapeJsArg(loc.id)}')"
                    style="margin-top: 0.4rem; padding: 0.25rem 0.5rem; background-color: #E65100; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.7rem; width: 100%;">
                    <i class="fas fa-info-circle"></i> 詳細を見る
                </button>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

export function setFillHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

export function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type} active`;

    setTimeout(() => {
        toast.classList.remove('active');
    }, UI_CONFIG.TOAST_DURATION);
}

export function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('active');
}

export function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.remove('active');
}

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

export function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
}

export function toggleFilter() {
    const content = document.querySelector('.filter-content');
    if (content) content.classList.toggle('active');
}
