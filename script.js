let currentsong = new Audio();
let songs = [];
let currfolder;

// Convert seconds to mm:ss
function secondsToMinutesSeconds(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return minutes + ":" + ("0" + remainingSeconds).slice(-2);
}

// Fetch songs from a folder
async function getsongs(folder) {
    currfolder = folder;
    try {
        let songsdata = await fetch(`songs/${folder}/`);
        songsdata = await songsdata.text();
    } catch (err) {
        console.error(`Failed to fetch folder songs/${folder}/:`, err);
        return;
    }

    const div = document.createElement("div");
    div.innerHTML = songsdata;
    const as = div.getElementsByTagName("a");

    songs = [];
    for (const element of as) {
        if (element.href.endsWith(".mp3")) {
            const filename = element.href.split(`/songs/${folder}/`).pop();
            songs.push(filename);
        }
    }

    // Populate playlist
    const songlists = document.querySelector(".songlists ul");
    if (!songlists) return;
    songlists.innerHTML = "";

    for (const song of songs) {
        const displayName = song.replaceAll("%20", " ");
        songlists.innerHTML += `
        <li>
            <img class="filter" src="img/music.svg" alt="">
            <div class="info">
                <div class="songname">${displayName}</div>
            </div>
            <span>Play now</span>
            <img class="filter" src="img/pause.svg" alt="">
        </li>`;
    }

    // Add click event to play songs
    Array.from(songlists.getElementsByTagName("li")).forEach(li => {
        const songnameEl = li.querySelector(".songname");
        if (!songnameEl) return;
        li.addEventListener("click", () => {
            const track = songnameEl.innerHTML.trim();
            playMusic(track);
            updatePlaylistIcons(track);
        });
    });
}

// Play a track
function playMusic(track) {
    if (!track) return;
    currentsong.src = `songs/${currfolder}/${track}`;
    currentsong.play();
    const songinfo = document.querySelector(".songinfo");
    if (songinfo) songinfo.innerHTML = track;
}

// Update play/pause icons
function updatePlaylistIcons(currentTrack) {
    Array.from(document.querySelectorAll(".songlists li")).forEach(li => {
        const img = li.querySelector("img:last-child");
        const trackName = li.querySelector(".songname").innerHTML.trim();
        if (!img || !trackName) return;
        img.src = (trackName === currentTrack) ? "img/play.svg" : "img/pause.svg";
    });
}

// Display albums/cards
async function displayalbum() {
    const cards = document.querySelector(".cards");
    if (!cards) return;

    let albums;
    try {
        albums = await fetch("songs/");
        albums = await albums.text();
    } catch (err) {
        console.error("Failed to fetch songs folder:", err);
        return;
    }

    const div = document.createElement("div");
    div.innerHTML = albums;
    const as = div.getElementsByTagName("a");

    for (const e of as) {
        if (!e.href.includes("/songs/")) continue;
        const folder = e.href.split("/songs/")[1].replace("/", "");

        let infodata;
        try {
            const infodataRes = await fetch(`songs/${folder}/info.json`);
            infodata = await infodataRes.json();
        } catch (err) {
            console.warn(`No info.json found for folder ${folder}`, err);
            continue;
        }

        cards.innerHTML += `
        <div data-folder="${folder}" class="card">
            <img src="songs/${folder}/cover.jpg" alt="">
            <h3>${infodata.title}</h3>
            <p>${infodata.description}</p>
            <div class="play-container">
                <svg class="play-button" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="30,20 30,80 80,50" />
                </svg>
            </div>
        </div>`;
    }

    // Album click event
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async () => {
            await getsongs(card.dataset.folder);
            const firstTrackEl = document.querySelector(".songlists li .songname");
            if (firstTrackEl) {
                const firstTrack = firstTrackEl.innerHTML.trim();
                playMusic(firstTrack);
                updatePlaylistIcons(firstTrack);
            }
        });
    });
}

// Main function wrapped in DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
    // Load default folder
    await getsongs("Sigma-mood");
    if (songs.length > 0) {
        playMusic(songs[0]);
        updatePlaylistIcons(songs[0]);
    }

    // Display albums
    displayalbum();

    // Grab elements safely
    const pauseBtn = document.getElementById("pause");
    const nextBtn = document.getElementById("next");
    const prevBtn = document.getElementById("prev");

    // Pause/play
    if (pauseBtn) {
        pauseBtn.addEventListener("click", () => {
            if (currentsong.paused) {
                currentsong.play();
            } else {
                currentsong.pause();
            }
            updatePlaylistIcons(currentsong.src.split(`/songs/${currfolder}/`).pop());
        });
    }

    // Time update
    currentsong.addEventListener("timeupdate", () => {
        const duration = currentsong.duration || 0;
        const durationEl = document.querySelector(".duration");
        if (durationEl) {
            durationEl.innerHTML = `${secondsToMinutesSeconds(currentsong.currentTime)}/${secondsToMinutesSeconds(duration)}`;
        }
        const circle = document.querySelector(".circle");
        if (circle) circle.style.left = `${(currentsong.currentTime / duration) * 100}%`;
    });

    // Seekbar
    const seekbar = document.querySelector(".seekbar");
    if (seekbar) {
        seekbar.addEventListener("click", e => {
            const percent = e.offsetX / e.target.getBoundingClientRect().width;
            currentsong.currentTime = percent * currentsong.duration;
            const circle = document.querySelector(".circle");
            if (circle) circle.style.left = `${percent * 100}%`;
        });
    }

    // Next / Prev buttons
    if (nextBtn) nextBtn.addEventListener("click", () => changeTrack(1));
    if (prevBtn) prevBtn.addEventListener("click", () => changeTrack(-1));

    function changeTrack(direction) {
        const currentIndex = songs.indexOf(currentsong.src.split(`/songs/${currfolder}/`).pop());
        const newIndex = currentIndex + direction;
        if (newIndex >= 0 && newIndex < songs.length) {
            playMusic(songs[newIndex]);
            updatePlaylistIcons(songs[newIndex]);
        }
    }

    // Volume controls
    const volumeInput = document.querySelector(".volume input");
    const volImg = document.querySelector(".volduration img");
    if (volumeInput) {
        volumeInput.addEventListener("change", e => {
            currentsong.volume = e.target.value / 100;
            if (volImg) volImg.src = currentsong.volume === 0 ? "img/mute.svg" : "img/vol.svg";
        });
    }

    if (volImg) {
        volImg.addEventListener("click", () => {
            if (currentsong.volume > 0) {
                currentsong.volume = 0;
                if (volumeInput) volumeInput.value = 0;
                volImg.src = "img/mute.svg";
            } else {
                currentsong.volume = 0.1;
                if (volumeInput) volumeInput.value = 10;
                volImg.src = "img/vol.svg";
            }
        });
    }

    // Hamburger menu
    const hamburger = document.querySelector(".hamburger");
    const cross = document.querySelector(".cross");
    const leftMenu = document.querySelector(".left");
    if (hamburger && leftMenu) hamburger.addEventListener("click", () => leftMenu.style.left = "0%");
    if (cross && leftMenu) cross.addEventListener("click", () => leftMenu.style.left = "-200%");
});
