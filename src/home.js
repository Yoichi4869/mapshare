// MapShare メイン画面
import { supabase } from './shared/supabase.js';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('Service Worker registered:', reg))
        .catch(err => console.log('Service Worker registration failed:', err));
}

// ======================
// モーダル制御
// ======================
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// オーバーレイ（背景）クリックで閉じる
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal.id);
    });
});

// Escキーで閉じる
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.open').forEach(m => closeModal(m.id));
    }
});

// 使い方
document.getElementById('openHelpBtn')?.addEventListener('click', () => openModal('helpModal'));
document.getElementById('closeHelpBtn')?.addEventListener('click', () => closeModal('helpModal'));
document.getElementById('closeHelpBtnFooter')?.addEventListener('click', () => closeModal('helpModal'));

// お問い合わせ
document.getElementById('openContactBtn')?.addEventListener('click', () => openModal('contactModal'));
document.getElementById('closeContactBtn')?.addEventListener('click', () => closeModal('contactModal'));
document.getElementById('cancelContactBtn')?.addEventListener('click', () => closeModal('contactModal'));

// ======================
// トースト
// ======================
function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show' + (type ? ' ' + type : '');
    setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// ======================
// お問い合わせ送信
// ======================
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const category = document.getElementById('contactCategory').value;
    const rawMessage = document.getElementById('contactMessage').value.trim();
    const contactData = {
        name: document.getElementById('contactName').value.trim(),
        email: document.getElementById('contactEmail').value.trim(),
        // contacts テーブルに category 列が無いため、項目は本文の先頭に含めて送信する
        message: `【${category}】\n${rawMessage}`,
        created_at: new Date().toISOString()
    };

    if (!contactData.name || !rawMessage) {
        showToast('お名前と内容を入力してください', 'error');
        return;
    }

    if (submitBtn) submitBtn.disabled = true;
    try {
        const { error } = await supabase.from('contacts').insert([contactData]);
        if (error) throw error;
        showToast('お問い合わせを送信しました', 'success');
        closeModal('contactModal');
        e.target.reset();
    } catch (error) {
        console.error('お問い合わせ送信エラー:', error);
        showToast('送信に失敗しました', 'error');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});
