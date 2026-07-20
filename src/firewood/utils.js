/**
 * ユーティリティ関数集
 */

import { UI_CONFIG } from './constants.js';

/**
 * HTML特殊文字をエスケープ（テキスト・属性値のXSS対策）
 * @param {*} str - エスケープする値
 * @returns {string}
 */
export function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, s => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
}

/**
 * インラインonclickのJS文字列引数向けエスケープ。
 * HTML属性コンテキストとJS文字列コンテキストの両方で安全になるよう、
 * 特殊文字をすべて \xNN 形式に変換する。
 * @param {*} str
 * @returns {string}
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
 * 座標で場所をグループ化
 * @param {Array} locations - 場所の配列
 * @returns {Object} 座標をキーとしたグループ化されたオブジェクト
 */
export function groupLocationsByCoords(locations) {
    const groups = {};
    locations.forEach(loc => {
        const key = `${loc.latitude},${loc.longitude}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(loc);
    });
    return groups;
}

/**
 * ポップアップコンテンツを作成
 * @param {Array} locations - 同じ座標の場所の配列
 * @returns {string} HTMLコンテンツ
 */
export function createPopupContent(locations) {
    let html = '<div style="max-height: 300px; overflow-y: auto; min-width: 250px;">';

    // 場所名とボタンを先に表示（最初の場所のみ）
    if (locations.length > 0) {
        const firstLoc = locations[0];
        const lat = Number(firstLoc.latitude);
        const lng = Number(firstLoc.longitude);
        html += `
            <div style="text-align: center; margin-bottom: 0.8rem; padding-bottom: 0.8rem; border-bottom: 2px solid #8B4513;">
                <h3 style="margin: 0 0 0.6rem 0; color: #8B4513; font-size: 1.1rem; font-weight: bold;">${escapeHtml(firstLoc.location_name) || '名称未設定'}</h3>
                <button
                    onclick="window.openAddToLocationModal(${lat}, ${lng}, '${escapeJsArg(firstLoc.location_name)}')"
                    style="padding: 0.3rem 0.6rem; background-color: #e26d37; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                    <i class="fas fa-plus"></i> 追加登録
                </button>
            </div>
        `;
    }

    // 薪の情報を表示
    locations.forEach((loc, index) => {
        html += `
            <div style="${index > 0 ? 'margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ccc;' : ''}">
                <p style="margin: 0.2rem 0; font-size: 0.9rem;"><strong>🪵 種類:</strong> ${escapeHtml(loc.wood_type) || '未設定'}</p>
                <p style="margin: 0.2rem 0; font-size: 0.9rem;"><strong>💰 価格:</strong> ${escapeHtml(loc.price) || '未設定'}円${loc.amount ? ' / ' + escapeHtml(loc.amount) : ''}</p>

                ${loc.description || loc.notes
                    ? `<p style="margin: 0.2rem 0; font-size: 0.85rem; color: #666;"><strong>📝 詳細:</strong> ${escapeHtml(loc.description || loc.notes)}</p>`
                    : ''
                }

                ${loc.sales_period
                    ? `<p style="margin: 0.2rem 0; font-size: 0.85rem;"><strong>📅 販売時期:</strong> ${escapeHtml(loc.sales_period)}</p>`
                    : ''
                }

                ${loc.contact_info
                    ? `<p style="margin: 0.2rem 0; font-size: 0.85rem;"><strong>📞 連絡先:</strong> ${escapeHtml(loc.contact_info)}</p>`
                    : ''
                }

                <button
                    onclick="window.showDetail('${escapeJsArg(loc.id)}')"
                    style="margin-top: 0.4rem; padding: 0.25rem 0.5rem; background-color: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.7rem; width: 100%;">
                    <i class="fas fa-info-circle"></i> 詳細を見る
                </button>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

/**
 * 表示高さを設定（モバイル対応）
 */
export function setFillHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

/**
 * トーストメッセージを表示
 * @param {string} message - 表示するメッセージ
 * @param {string} type - トーストのタイプ ('success', 'error', 'info')
 */
export function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type} active`;

    setTimeout(() => {
        toast.classList.remove('active');
    }, UI_CONFIG.TOAST_DURATION);
}

/**
 * ローディング表示
 */
export function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('active');
}

/**
 * ローディング非表示
 */
export function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.remove('active');
}

/**
 * モーダルを開く
 * @param {string} modalId - モーダルのID
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

/**
 * モーダルを閉じる
 * @param {string} modalId - モーダルのID
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

/**
 * フォームをリセット
 * @param {string} formId - フォームのID
 */
export function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
}

/**
 * フィルターパネルを開閉
 */
export function toggleFilter() {
    const content = document.querySelector('.filter-content');
    if (content) content.classList.toggle('active');
}

