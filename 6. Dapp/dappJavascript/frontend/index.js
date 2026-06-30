import { ethers } from './ethers.min.js';

import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config.js';

const connectButton = document.getElementById('connectButton');
const getNumber = document.getElementById('getNumber');
const theNumber = document.getElementById('theNumber');
const inputNumber = document.getElementById('inputNumber');
const setNumber = document.getElementById('setNumber');

let connectedAccount;

connectButton.addEventListener('click', async function() {
    try {
        if(typeof window.ethereum !== 'undefined') {
            const resultAccount = await window.ethereum.request({ method: "eth_requestAccounts" });
            connectedAccount = ethers.getAddress(resultAccount[0]);
            connectButton.innerHTML = "Connected with " + connectedAccount;
        }
        else {
            connectButton.innerHTML = "Please install Metamask";
        }
    }
    catch(e) {
        console.error(e);
    }
})

getNumber.addEventListener('click', async function() {
    if(connectedAccount) {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
            const number = await contract.getNumber();
            theNumber.innerHTML = number.toString();
        }
        catch(e) {
            console.error(e);
        }
    }
})

setNumber.addEventListener('click', async function() {
    if(connectedAccount) {
        try {
            const inputNumberByUser = inputNumber.value;
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            let transaction = await contract.setNumber(inputNumberByUser);
            await transaction.wait();
            
        }
        catch(e) {
            console.error(e);
        }
    }
})