import { ethers } from './ethers.min.js';

import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config.js';

const connectButton = document.getElementById('connectButton');
const connectLabel = connectButton.querySelector('.btn-connect-label');
const balanceOfUser = document.getElementById('balanceOfUser');
const balanceHint = document.getElementById('balanceHint');
const inputSendEthers = document.getElementById('inputSendEthers');
const buttonSendEthers = document.getElementById('buttonSendEthers');
const inputWithdrawEthers = document.getElementById('inputWithdrawEthers');
const buttonWithdrawEthers = document.getElementById('buttonWithdrawEthers');
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
    buttonSendEthers.disabled = !enabled;
    buttonWithdrawEthers.disabled = !enabled;
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
            await getBalanceOfUser();
        } else {
            connectLabel.textContent = 'Installez MetaMask';
            showToast('MetaMask n\'est pas détecté.', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast(parseError(e), 'error');
    }
});

/* ---------- Deposit ---------- */

buttonSendEthers.addEventListener('click', async function () {
    if (!connectedAccount) return;

    const amountToDeposit = inputSendEthers.value;
    if (!amountToDeposit || Number(amountToDeposit) <= 0) {
        showToast('Saisissez un montant valide à déposer.', 'error');
        return;
    }

    try {
        setButtonLoading(buttonSendEthers, true, 'Dépôt en cours...');
        const amountToDepositInWei = ethers.parseEther(amountToDeposit.toString());
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        showToast('Transaction envoyée, en attente de confirmation...', 'info');
        let transaction = await contract.sendEthers({ value: amountToDepositInWei });
        await transaction.wait();
        inputSendEthers.value = '';
        showToast('Dépôt de ' + amountToDeposit + ' ETH confirmé', 'success');
        await getBalanceOfUser();
    } catch (e) {
        console.error(e);
        showToast(parseError(e), 'error');
    } finally {
        setButtonLoading(buttonSendEthers, false);
    }
});

/* ---------- Withdraw ---------- */

buttonWithdrawEthers.addEventListener('click', async function () {
    if (!connectedAccount) return;

    const amountToWithdraw = inputWithdrawEthers.value;
    if (!amountToWithdraw || Number(amountToWithdraw) <= 0) {
        showToast('Saisissez un montant valide à retirer.', 'error');
        return;
    }

    try {
        setButtonLoading(buttonWithdrawEthers, true, 'Retrait en cours...');
        const amountToWithdrawInWei = ethers.parseEther(amountToWithdraw.toString());
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        showToast('Transaction envoyée, en attente de confirmation...', 'info');
        let transaction = await contract.withdraw(amountToWithdrawInWei);
        await transaction.wait();
        inputWithdrawEthers.value = '';
        showToast('Retrait de ' + amountToWithdraw + ' ETH confirmé', 'success');
        await getBalanceOfUser();
    } catch (e) {
        console.error(e);
        showToast(parseError(e), 'error');
    } finally {
        setButtonLoading(buttonWithdrawEthers, false);
    }
});

/* ---------- Balance ---------- */

async function getBalanceOfUser() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const amountBalanceOfUser = await contract.getBalanceOfUser(connectedAccount);
    balanceOfUser.textContent = ethers.formatEther(amountBalanceOfUser);
    balanceHint.textContent = 'Mis à jour à l\'instant · libellé en ETH';
}
