// 1. DATA SETUP
const defaultMunData = {
    UNSC: [
        { name: "USA", status: "Available" }, { name: "UK", status: "Available" }, { name: "France", status: "Available" },
        { name: "Russia", status: "Available" }, { name: "China", status: "Available" }, { name: "India", status: "Available" }, { name: "Brazil", status: "Available" }
    ],
    UNHRC: [
        { name: "Germany", status: "Available" }, { name: "Japan", status: "Available" }, { name: "South Africa", status: "Available" },
        { name: "Argentina", status: "Available" }, { name: "Canada", status: "Available" }, { name: "Saudi Arabia", status: "Available" }, { name: "Australia", status: "Available" }
    ],
    DISEC: [
        { name: "Pakistan", status: "Available" }, { name: "Israel", status: "Available" }, { name: "Iran", status: "Available" },
        { name: "North Korea", status: "Available" }, { name: "South Korea", status: "Available" }, { name: "Ukraine", status: "Available" }, { name: "Turkey", status: "Available" }
    ]
};

let munData = JSON.parse(localStorage.getItem('munData')) || defaultMunData;
let gslData = JSON.parse(localStorage.getItem('gslData')) || { UNSC: [], UNHRC: [], DISEC: [] };

function saveData() {
    localStorage.setItem('munData', JSON.stringify(munData));
    localStorage.setItem('gslData', JSON.stringify(gslData));
}

// 2. COUNTRY MATRIX
const matrixFilter = document.getElementById('matrix-committee-filter');
const matrixGrid = document.getElementById('matrix-grid');
const matrixStats = document.getElementById('matrix-stats');

function renderMatrix() {
    const comm = matrixFilter.value;
    matrixGrid.innerHTML = ''; 
    let availableCount = 0;

    munData[comm].forEach(country => {
        if(country.status === "Available") availableCount++;
        const box = document.createElement('div');
        box.className = `country-box ${country.status === 'Available' ? 'available-seat' : 'allocated-seat'}`;
        box.innerHTML = `${country.name} <br> <small>${country.status}</small>`;
        matrixGrid.appendChild(box);
    });
    matrixStats.innerText = `(${availableCount}/7 Seats Available)`;
}
matrixFilter.addEventListener('change', renderMatrix);

// 3. REGISTRATION FORM
const regCommittee = document.getElementById('reg-committee');
const regCountry = document.getElementById('reg-country');
const regForm = document.getElementById('reg-form');

regCommittee.addEventListener('change', () => {
    const comm = regCommittee.value;
    regCountry.innerHTML = '<option value="">-- Choose Country --</option>';
    if(comm) {
        munData[comm].filter(c => c.status === "Available").forEach(c => {
            regCountry.innerHTML += `<option value="${c.name}">${c.name}</option>`;
        });
    }
});

regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const comm = regCommittee.value;
    const country = regCountry.value;

    let targetCountry = munData[comm].find(c => c.name === country);
    if(targetCountry) {
        targetCountry.status = "Allocated"; 
        saveData(); 
        alert(`${country} successfully allocated in ${comm}!`);
        
        regForm.reset();
        regCountry.innerHTML = '<option value="">-- Choose Country --</option>';
        renderMatrix(); 
        if(activeRoom === comm) updateGslDropdown(); 
    }
});

// 4. STUDY GUIDES 
const guideSelect = document.getElementById('guide-committee-select');
const guideBox = document.getElementById('guide-content-box');
const guideTitle = document.getElementById('guide-title');
const guideAgenda = document.getElementById('guide-agenda');
const guideDownloadBtn = document.getElementById('guide-download-btn');

const guideInfo = {
    UNSC: { title: "UNSC Study Guide", agenda: "Addressing Cybersecurity Threats", file: "guides/unsc.pdf" },
    UNHRC: { title: "UNHRC Study Guide", agenda: "Protection of Digital Privacy Rights", file: "guides/unhrc.pdf" },
    DISEC: { title: "DISEC Study Guide", agenda: "Regulation of Autonomous Weapons", file: "guides/disec.pdf" }
};

guideSelect.addEventListener('change', () => {
    const comm = guideSelect.value;
    if(comm) {
        guideBox.style.display = 'block';
        guideTitle.innerText = guideInfo[comm].title;
        guideAgenda.innerText = `Agenda: ${guideInfo[comm].agenda}`;
        guideDownloadBtn.href = guideInfo[comm].file; // Path to your guides folder
    } else {
        guideBox.style.display = 'none';
    }
});

// 5. LIVE DEBATE SIMULATOR
let activeRoom = "UNSC";
const tabs = {
    UNSC: document.getElementById('tab-unsc'),
    UNHRC: document.getElementById('tab-unhrc'),
    DISEC: document.getElementById('tab-disec')
};
const activeRoomTitle = document.getElementById('active-room-title');
const speakerSelect = document.getElementById('speaker-select');
const gslQueue = document.getElementById('gsl-queue');

function switchRoom(roomName) {
    activeRoom = roomName;
    activeRoomTitle.innerText = `${roomName} Room Active`;
    
    Object.values(tabs).forEach(tab => tab.classList.remove('active-tab'));
    tabs[roomName].classList.add('active-tab');

    updateGslDropdown();
    renderGslQueue();
    resetTimer(); 
}

Object.keys(tabs).forEach(room => {
    tabs[room].addEventListener('click', () => switchRoom(room));
});

function updateGslDropdown() {
    speakerSelect.innerHTML = '<option value="">-- Select Allocated Country --</option>';
    munData[activeRoom].filter(c => c.status === "Allocated").forEach(c => {
        if(!gslData[activeRoom].includes(c.name)) {
            speakerSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
        }
    });
}

function renderGslQueue() {
    gslQueue.innerHTML = '';
    gslData[activeRoom].forEach((country, index) => {
        const li = document.createElement('li');
        li.innerText = index === 0 ? `${country} (Speaking Now)` : country;
        gslQueue.appendChild(li);
    });
}

document.getElementById('add-speaker-btn').addEventListener('click', () => {
    const country = speakerSelect.value;
    if(country) {
        gslData[activeRoom].push(country);
        saveData();
        updateGslDropdown();
        renderGslQueue();
    }
});

document.getElementById('next-speaker-btn').addEventListener('click', () => {
    if(gslData[activeRoom].length > 0) {
        gslData[activeRoom].shift();
        saveData();
        updateGslDropdown();
        renderGslQueue();
        resetTimer();
    }
});

// 6. TIMER LOGIC
let timerInterval;
let timeRemaining = 60; 
const timerDisplay = document.getElementById('timer-display');

function updateTimerUI() {
    const mins = String(Math.floor(timeRemaining / 60)).padStart(2, '0');
    const secs = String(timeRemaining % 60).padStart(2, '0');
    timerDisplay.innerText = `${mins}:${secs}`;
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timeRemaining = 60;
    updateTimerUI();
}

document.getElementById('start-btn').addEventListener('click', () => {
    if(!timerInterval && timeRemaining > 0) {
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerUI();
            if(timeRemaining <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                alert('Time is up for this speaker!');
            }
        }, 1000);
    }
});

document.getElementById('pause-btn').addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
});

document.getElementById('reset-btn').addEventListener('click', resetTimer);

// Initialize Page
renderMatrix();
switchRoom('UNSC');