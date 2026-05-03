const terminal = document.getElementById("terminal");
const progress = document.getElementById("progress");
const video = document.getElementById("video");
const systemLog = document.getElementById("system-log");
const map = document.getElementById("map");
const virtualBalanceEl = document.getElementById("virtual-balance");
const receiverBalanceEl = document.getElementById("receiver-balance");
const withdrawHistoryEl = document.getElementById("withdraw-history");
const lossAmountEl = document.getElementById("loss-amount");
const queryStatusEl = document.getElementById("query-status");
const verifyBtn = document.getElementById("verify-btn");
const progressText = document.getElementById("progress-text");
const withdrawBtn = document.getElementById("withdraw-btn");

const receiverAccountNumberEl = document.getElementById("receiver-account-number");
const receiverAccountNameEl = document.getElementById("receiver-account-name");
const receiverBankNameEl = document.getElementById("receiver-bank-name");

const virtualBankNameEl = document.getElementById("virtual-bank-name");
const virtualAccountNumberEl = document.getElementById("virtual-account-number");

const victimFullNameEl = document.getElementById("victim-full-name");
const victimAccountNumberInputEl = document.getElementById("victim-account-number");
const victimBankNameEl = document.getElementById("victim-bank-name");

const targetScamAccountEl = document.getElementById("target-scam-account");
const targetBankNameEl = document.getElementById("target-bank-name");

const activateAccountBtn = document.getElementById("activate-account-btn");
const activationPanelEl = document.getElementById("activation-panel");
const activationFeeEl = document.getElementById("activation-fee");
const activationTotalEl = document.getElementById("activation-total");

let virtualBalance = null;
let receiverBalance = 0;
let isVerifyingBalance = false;
let isWithdrawing = false;
let isActivating = false;

/* ===================== UTIL ===================== */

function formatRupiah(value) {
    return Number(value).toLocaleString("id-ID");
}

function parseRupiahInput(rawText) {
    if (!rawText) return NaN;
    const digits = rawText.replace(/[^\d]/g, "");
    return digits ? Number(digits) : NaN;
}

function updateBalanceUI() {
    virtualBalanceEl.innerText = virtualBalance === null ? "-" : formatRupiah(virtualBalance);
    receiverBalanceEl.innerText = receiverBalance === null ? "-" : formatRupiah(receiverBalance);
}

/* ===================== SYNC ===================== */

function syncInfoPanels() {
    receiverAccountNameEl.innerText = victimFullNameEl.value || "-";
    receiverAccountNumberEl.innerText = victimAccountNumberInputEl.value || "-";
    receiverBankNameEl.innerText = victimBankNameEl.value || "-";

    virtualAccountNumberEl.innerText = targetScamAccountEl.value || "-";
    virtualBankNameEl.innerText = targetBankNameEl.value || "-";
}

/* ===================== PROGRESS VERIFY ===================== */

function runProgressBar(barEl, textEl, duration, onTick, onComplete) {
    const start = Date.now();

    if (barEl) barEl.style.width = "0%";
    if (textEl) textEl.innerText = "0%";

    const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        const percent = Math.min(100, Math.floor((elapsed / duration) * 100));

        if (barEl) barEl.style.width = percent + "%";
        if (textEl) textEl.innerText = percent + "%";
        if (typeof onTick === "function") onTick(percent, elapsed);

        if (elapsed >= duration) {
            clearInterval(interval);
            if (barEl) barEl.style.width = "100%";
            if (textEl) textEl.innerText = "100%";
            if (typeof onComplete === "function") onComplete();
        }
    }, 100);
}

function verifyVirtualBalance() {
    if (isVerifyingBalance) return;

    const targetAmount = parseRupiahInput(lossAmountEl.value);
    if (!targetAmount) return;

    isVerifyingBalance = true;
    verifyBtn.disabled = true;
    runProgressBar(progress, progressText, 3000, () => {
        virtualBalance = Math.floor(Math.random() * targetAmount);
        updateBalanceUI();
    }, () => {
        virtualBalance = targetAmount;
        updateBalanceUI();

        isVerifyingBalance = false;
        verifyBtn.disabled = false;

        appendWithdrawHistory(`==> Saldo terverifikasi di rekening target pelaku Rp ${formatRupiah(targetAmount)}`);
    });
}

/* ===================== WITHDRAW ===================== */

function withdrawVirtual() {
    if (isWithdrawing || virtualBalance === null || virtualBalance <= 0) return;

    isWithdrawing = true;
    if (withdrawBtn) withdrawBtn.disabled = true;
    const amount = virtualBalance;

    runProgressBar(progress, progressText, 2000, null, () => {
        virtualBalance = 0;
        receiverBalance += amount;

        updateBalanceUI();

        appendWithdrawHistory(`==> Saldo berhasil pindah ke rekening penerima Rp ${formatRupiah(amount)} aktivasi rekening untuk di teruskan ke rekening tujuan`);

        activateAccountBtn.classList.remove("hidden");
        isWithdrawing = false;
        if (withdrawBtn) withdrawBtn.disabled = false;
    });
}

/* ===================== ACTIVATION ===================== */

activateAccountBtn?.addEventListener("click", () => {
    if (isActivating) return;
    isActivating = true;
    activateAccountBtn.disabled = true;

    runProgressBar(progress, progressText, 2000, null, () => {
        const loss = parseRupiahInput(lossAmountEl.value) || 0;
        const fee = parseRupiahInput(activationFeeEl.value) || 0;

        const total = loss + fee;

        // 🔥 update total diterima
        receiverBalance = total;
        updateBalanceUI();

        updateActivationTotal();

        appendWithdrawHistory(
            `==> Activasi gagal saldo sebesar: Rp ${formatRupiah(loss)} activasi rekening terlebih dahulu senilai: Rp ${formatRupiah(fee)} total masuk ke rekening penerima: Rp ${formatRupiah(total)}`
        );

        isActivating = false;
        activateAccountBtn.disabled = false;
    });
});

/* ===================== INPUT FORMAT ===================== */

activationFeeEl?.addEventListener("input", () => {
    const val = parseRupiahInput(activationFeeEl.value);
    if (val) activationFeeEl.value = formatRupiah(val);
    updateActivationTotal();
});

lossAmountEl?.addEventListener("input", () => {
    const val = parseRupiahInput(lossAmountEl.value);
    if (val) lossAmountEl.value = formatRupiah(val);
    updateActivationTotal();
});

/* ===================== TOTAL ===================== */

function updateActivationTotal() {
    const loss = parseRupiahInput(lossAmountEl.value) || 0;
    const fee = parseRupiahInput(activationFeeEl.value) || 0;

    if (activationTotalEl) {
        activationTotalEl.innerText = formatRupiah(loss + fee);
    }
}

/* ===================== HISTORY ===================== */

function appendWithdrawHistory(msg) {
    if (withdrawHistoryEl) {
        if (withdrawHistoryEl.innerText.includes("Belum ada transaksi")) {
            withdrawHistoryEl.innerHTML = "";
        }

        const p = document.createElement("p");
        p.innerText = msg;
        withdrawHistoryEl.prepend(p);
    }

    // Mirror log to terminal panel (if available) so activity is visible in both places.
    if (terminal) {
        const line = document.createElement("div");
        line.innerText = msg;
        terminal.prepend(line);
    }
}

/* ===================== LIVE EFFECT ===================== */

setInterval(() => {
    if (!systemLog) return;

    const line = document.createElement("div");
    line.innerText = "[OK] Update sistem...";
    systemLog.appendChild(line);

    if (systemLog.childNodes.length > 20) {
        systemLog.removeChild(systemLog.firstChild);
    }
}, 1000);

setInterval(() => {
    if (!map) return;

    const dot = document.createElement("div");
    dot.className = "dot";

    dot.style.top = Math.random() * 100 + "%";
    dot.style.left = Math.random() * 100 + "%";

    map.appendChild(dot);

    setTimeout(() => dot.remove(), 3000);
}, 500);

/* ===================== INIT ===================== */

victimFullNameEl?.addEventListener("input", syncInfoPanels);
victimAccountNumberInputEl?.addEventListener("input", syncInfoPanels);
victimBankNameEl?.addEventListener("input", syncInfoPanels);
targetScamAccountEl?.addEventListener("input", syncInfoPanels);
targetBankNameEl?.addEventListener("input", syncInfoPanels);

updateBalanceUI();
updateActivationTotal();
syncInfoPanels();