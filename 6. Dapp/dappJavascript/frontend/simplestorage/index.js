import { ethers } from './ethers.min.js';

import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config.js';

const connectButton = document.getElementById('connectButton');
const connectLabel = connectButton.querySelector('.btn-connect-label');
const getNumber = document.getElementById('getNumber');
const theNumber = document.getElementById('theNumber');
const inputNumber = document.getElementById('inputNumber');
const setNumber = document.getElementById('setNumber');
const toast = document.getElementById('toast');

let connectedAccount;
let toastTimer;

/* ---------- UI helpers ---------- */

function shortenAddress(address) {
    return address.slice(0, 6) + '...' + address.slice(-4);
}

function showToast(message, type = 'info') {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    toastTimer = setTimeout(() => {
        toast.className = 'toast ' + type;
    }, 4000);
}

function setActionsEnabled(enabled) {
    getNumber.disabled = !enabled;
    setNumber.disabled = !enabled;
}

function setButtonLoading(button, isLoading, loadingText) {
    if (isLoading) {
        button.dataset.label = button.innerHTML;
        button.innerHTML = '<span class="spinner"></span>' + loadingText;
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.label || button.innerHTML;
        button.disabled = false;
    }
}

function parseError(e) {
    if (e?.code === 'ACTION_REJECTED') return 'Transaction refusée dans le wallet.';
    if (e?.reason) return e.reason;
    if (e?.shortMessage) return e.shortMessage;
    return e?.message || 'Une erreur est survenue.';
}

/* ---------- Wallet connection ---------- */

connectButton.addEventListener('click', async function () {
    try {
        if (typeof window.ethereum !== 'undefined') {
            const resultAccount = await window.ethereum.request({ method: 'eth_requestAccounts' });
            connectedAccount = ethers.getAddress(resultAccount[0]);
            connectLabel.textContent = shortenAddress(connectedAccount);
            connectButton.classList.add('connected');
            connectButton.title = connectedAccount;
            setActionsEnabled(true);
            showToast('Wallet connecté', 'success');
        } else {
            connectLabel.textContent = 'Installez MetaMask';
            showToast('MetaMask n\'est pas détecté.', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast(parseError(e), 'error');
    }
});

/* ---------- Read value ---------- */

getNumber.addEventListener('click', async function () {
    if (!connectedAccount) return;
    try {
        setButtonLoading(getNumber, true, 'Lecture...');
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const number = await contract.getNumber();
        theNumber.textContent = number.toString();
        showToast('Valeur récupérée', 'success');
    } catch (e) {
        console.error(e);
        showToast(parseError(e), 'error');
    } finally {
        setButtonLoading(getNumber, false);
    }
});

/* ---------- Write value ---------- */

setNumber.addEventListener('click', async function () {
    if (!connectedAccount) return;

    const inputNumberByUser = inputNumber.value;
    if (inputNumberByUser === '') {
        showToast('Saisissez un nombre à enregistrer.', 'error');
        return;
    }

    try {
        setButtonLoading(setNumber, true, 'Enregistrement...');
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        showToast('Transaction envoyée, en attente de confirmation...', 'info');
        let transaction = await contract.setNumber(inputNumberByUser);
        await transaction.wait();
        theNumber.textContent = inputNumberByUser;
        inputNumber.value = '';
        showToast('Valeur enregistrée on-chain', 'success');
    } catch (e) {
        console.error(e);
        showToast(parseError(e), 'error');
    } finally {
        setButtonLoading(setNumber, false);
    }
});
