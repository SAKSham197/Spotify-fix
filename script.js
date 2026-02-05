/* ================= STATE ================= */
let audio = new Audio();
let songs = [];
let currentFolder = "";
let currentIndex = -1;

/* ================= DOM ================= */
const pauseBtn = document.getElementById("pause");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const volumeSlider = document.querySelector(".volume input");
const volumeIcon = document.querySelector(".volduration img");
const hamburger = document.querySelector(".hamburger");
const cross = document.querySelector(".cross");
const songInfo = document.querySelector(".songinfo");
const songListUL = document.querySelector(".songlists ul");

/* ================= UTILS ================= */
function formatTime(sec) {
    if (isNaN(sec)) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}

/* ================= ALBUM LIST ================= */
const albums = [
    "Sigma mood",
    "Happy mood",
    "Fresh vibes",
    "Eminem",
    "Phonk",
    "Sad tone",
    "Old songs",
    "Spiritual",
    "Honey Singh",
    "Imagine dragons"
];

/* ================= CORE PLAYBACK ================= */
function playByIndex(index) {
    if (index < 0 || index >= songs.length) return;

    currentIndex = index;
    audio.src = `songs/${currentFolder}/${songs[index]}`;
    audio.play().catch(() => {});
    pauseBtn.src = "img/play.svg";
    songInfo.innerText = songs[index];

    updateActiveSong();
}

function updateActiveSong() {
    document.querySelectorAll(".songlists li").forEach(li => {
        li.classList.remove("active");
        li.querySelector("img:last-child").src = "img/pause.svg";
    });

    const active = document.querySelector(
        `.songlists li[data-index="${currentIndex}"]`
    );
    if (active) {
        active.classList.add("active");
        active.querySelector("img:last-child").src = "img/play.svg";
    }
}

/* ================= LOAD SONGS ================= */
async function loadSongs(folder) {
    currentFolder = folder;
    songs = [];

    songListUL.innerHTML = "";

    const res = await fetch(`songs/${folder}/info.json`);
    const data = await res.json();
    songs = data.songs;

    songs.forEach((song, i) => {
        songListUL.innerHTML += `
            <li data-index="${i}">
                <img class="filter" src="img/music.svg">
                <div class="info">
                    <div class="songname">${song}</div>
                </div>
                <span>Play now</span>
                <img class="filter" src="img/pause.svg">
            </li>
        `;
    });

    document.querySelectorAll(".songlists li").forEach(li => {
        li.addEventListener("click", () => {
            playByIndex(Number(li.dataset.index));
        });
    });

    // Load a random song automatically
    const randomIndex = Math.floor(Math.random() * songs.length);
    playByIndex(randomIndex);
}

/* ================= ALBUMS ================= */
async function loadAlbums() {
    const cards = document.querySelector(".cards");
    cards.innerHTML = "";

    for (const folder of albums) {
        const res = await fetch(`songs/${folder}/info.json`);
        const data = await res.json();

        cards.innerHTML += `
            <div class="card" data-folder="${folder}">
                <img src="songs/${folder}/cover.jpg">
                <h3>${data.title}</h3>
                <p>${data.description}</p>
            </div>
        `;
    }

    // Attach event listeners to cards
    attachCardListeners();
}

function attachCardListeners() {
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", () => {
            loadSongs(card.dataset.folder);
        });
    });
}

/* ================= CONTROLS ================= */
pauseBtn.addEventListener("click", () => {
    if (currentIndex === -1) return;

    if (audio.paused) {
        audio.play().catch(() => {});
        pauseBtn.src = "img/play.svg";
    } else {
        audio.pause();
        pauseBtn.src = "img/pause.svg";
    }
});

nextBtn.addEventListener("click", () => {
    if (songs.length === 0) return;
    const nextIdx = (currentIndex + 1) % songs.length;
    playByIndex(nextIdx);
});

prevBtn.addEventListener("click", () => {
    if (songs.length === 0) return;
    const prevIdx = (currentIndex - 1 + songs.length) % songs.length;
    playByIndex(prevIdx);
});

/* ================= PROGRESS ================= */
audio.addEventListener("timeupdate", () => {
    document.querySelector(".duration").innerText =
        `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;

    document.querySelector(".circle").style.left =
        `${(audio.currentTime / audio.duration) * 100 || 0}%`;
});

document.querySelector(".seekbar").addEventListener("click", e => {
    audio.currentTime =
        (e.offsetX / e.target.clientWidth) * audio.duration;
});

/* ================= VOLUME ================= */
volumeSlider.addEventListener("input", e => {
    audio.volume = e.target.value / 100;
    volumeIcon.src = audio.volume === 0 ? "img/mute.svg" : "img/vol.svg";
});

volumeIcon.addEventListener("click", () => {
    if (audio.volume > 0) {
        audio.volume = 0;
        volumeSlider.value = 0;
        volumeIcon.src = "img/mute.svg";
    } else {
        audio.volume = 0.1;
        volumeSlider.value = 10;
        volumeIcon.src = "img/vol.svg";
    }
});

/* ================= SIDEBAR ================= */
hamburger.addEventListener("click", () => {
    document.querySelector(".left").style.left = "0%";
});

cross.addEventListener("click", () => {
    document.querySelector(".left").style.left = "-200%";
});

/* ================= INIT ================= */
loadSongs("Sigma mood");
loadAlbums();
