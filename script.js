let currentsong = new Audio();
let songs;
let currfolder;

function secondsToMinutesSeconds(seconds) {
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = Math.floor(seconds % 60);
    return minutes + ":" + ("0" + remainingSeconds).slice(-2);
}

// Fetch songs
async function getsongs(folder) {
    currfolder = folder;
    let songsdata = await fetch(`songs/${folder}/`);
    songsdata = await songsdata.text();
    let div = document.createElement("div");
    div.innerHTML = songsdata;
    let as = div.getElementsByTagName("a");
    songs = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith("mp3")) {
            songs.push(element.href);
        }
    }

    // Show all songs in playlist
    let songlists = document.querySelector(".songlists ul");
    songlists.innerHTML = "";
    for (const song of songs) {
        songlists.innerHTML += `
            <li>
                <img class="filter" src="img/music.svg" alt="">
                <div class="info">
                    <div class="songname">${song.replaceAll("%20", " ").split(`/songs/${currfolder}/`)[1]}</div>
                </div>
                <span>Play now</span>
                <img class="filter" src="img/pause.svg" alt="">
            </li>`;
    }

    // Add event listener to each song
    Array.from(document.querySelector(".songlists li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.querySelector(".songname").innerHTML.replaceAll("  ", " ").trim());
        });
    });

    // Change play/pause icon in list
    Array.from(document.querySelector(".songlists li")).forEach(e => {
        e.addEventListener("click", () => {
            Array.from(document.querySelector(".songlists li")).forEach(el => {
                el.querySelector("img:last-child").src = "img/pause.svg";
            });
            e.querySelector("img:last-child").src = "img/play.svg";
        });
    });
}

// Play music
const playMusic = (track) => {
    currentsong.src = `/songs/${currfolder}/` + track;
    currentsong.play();
    pause.src = "img/play.svg";
    document.querySelector(".songinfo").innerHTML = track;
};

// Display albums
async function displayalbum() {
    let cards = document.querySelector(".cards");
    let albums = await fetch("songs/");
    albums = await albums.text();
    let div = document.createElement("div");
    div.innerHTML = albums;
    let as = Array.from(div.getElementsByTagName("a"));

    for (const e of as) {
        if (e.href.includes("/songs/")) {
            let folder = e.href.split("/songs/")[1].replace("/", "");
            let infodata = await fetch(`songs/${folder}/info.json`);
            infodata = await infodata.json();

            cards.innerHTML += `
                <div>
                    <div data-folder=${folder} class="card">
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h3>${infodata.title}</h3>
                        <p>${infodata.description}</p>
                        <div class="play-container">
                            <svg class="play-button" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <polygon points="30,20 30,80 80,50" />
                            </svg>
                        </div>
                    </div>
                </div>`;
        }
    }

    // Load songs when clicking on album card
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async (item) => {
            await getsongs(item.currentTarget.dataset.folder.replace("%20", " "));
            let track = document.querySelector(".songlists li .songname").innerHTML.trim();
            playMusic(track);
            document.querySelector(".songlists li img:last-child").src = "img/play.svg";
        });
    });
}

async function main() {
    // Load songs
    await getsongs("Sigma mood");
    currentsong.src = songs[0];

    let a = songs[0].split("3000")[1];
    document.querySelector(".songinfo").innerHTML =
        a.replaceAll("%20", " ").replace(`/songs/${currfolder}/`, "");

    // Show albums
    displayalbum();

    // Pause button
    pause.addEventListener("click", () => {
        if (currentsong.paused) {
            pause.src = "img/play.svg";
            currentsong.play();

            Array.from(document.querySelectorAll(".songlists li")).forEach(e => {
                if (e.querySelector(".songname").innerHTML.trim().replaceAll("  ", " ") ===
                    currentsong.src.replaceAll("%20", " ").split(`/songs/${currfolder}/`)[1]) {
                    e.querySelector("img:last-child").src = "img/play.svg";
                }
            });
        } else {
            pause.src = "img/pause.svg";
            currentsong.pause();

            Array.from(document.querySelectorAll(".songlists li")).forEach(e => {
                if (e.querySelector(".songname").innerHTML.trim().replaceAll("  ", " ") ===
                    currentsong.src.replaceAll("%20", " ").split(`/songs/${currfolder}/`)[1]) {
                    e.querySelector("img:last-child").src = "img/pause.svg";
                }
            });
        }
    });

    // Update seekbar and duration
    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".duration").innerHTML =
            `${secondsToMinutesSeconds(currentsong.currentTime)}/${secondsToMinutesSeconds(currentsong.duration)}`;
        document.querySelector(".circle").style.left =
            `${(currentsong.currentTime / currentsong.duration) * 100}%`;
    });

    // Seekbar click
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = (percent * currentsong.duration) / 100;
    });

    // Next button
    next.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src);
        if (index + 1 <= songs.length - 1) {
            playMusic(songs[index + 1].replaceAll("%20", " ").split(`/songs/${currfolder}/`)[1]);
        }
        Array.from(document.querySelectorAll(".songlists li")).forEach(e => {
            if (currentsong.src.replaceAll("%20", " ").split(`/songs/${currfolder}/`)[1] ===
                e.querySelector(".songname").innerHTML.trim().replaceAll("  ", " ")) {
                Array.from(document.querySelectorAll(".songlists li")).forEach(el => {
                    el.querySelector("img:last-child").src = "img/pause.svg";
                });
                e.querySelector("img:last-child").src = "img/play.svg";
            }
        });
    });

    // Prev button
    prev.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src);
        if (index - 1 >= 0) {
            playMusic(songs[index - 1].replaceAll("%20", " ").split(`/songs/${currfolder}/`)[1]);
        }
        Array.from(document.querySelectorAll(".songlists li")).forEach(e => {
            if (currentsong.src.replaceAll("%20", " ").split(`/songs/${currfolder}/`)[1] ===
                e.querySelector(".songname").innerHTML.trim().replaceAll("  ", " ")) {
                Array.from(document.querySelectorAll(".songlists li")).forEach(el => {
                    el.querySelector("img:last-child").src = "img/pause.svg";
                });
                e.querySelector("img:last-child").src = "img/play.svg";
            }
        });
    });

    // Volume change
    document.querySelector(".volume input").addEventListener("change", (e) => {
        let img = document.querySelector(".volduration img");
        currentsong.volume = e.target.value / 100;
        img.src = currentsong.volume === 0 ? "img/mute.svg" : "img/vol.svg";
    });

    // Volume mute/unmute toggle
    document.querySelector(".volduration img").addEventListener("click", () => {
        let img = document.querySelector(".volduration img");
        if (img.src.endsWith("vol.svg")) {
            img.src = "img/mute.svg";
            currentsong.volume = 0;
            document.querySelector(".volume input").value = 0;
        } else {
            img.src = "img/vol.svg";
            currentsong.volume = 0.1;
            document.querySelector(".volume input").value = 10;
        }
    });

    // Hamburger menu
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0%";
    });

    // Close sidebar
    document.querySelector(".cross").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-200%";
    });
}

main();
