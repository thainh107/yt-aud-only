import "./main.css";

const audio = new Audio();
let entries = [];
let data = {};
let duration;
let replayButton;
let repeatButton;
let shuffleButton;
let playButton;
let thumbnail;
let volumeOffButton;
let skipNextButton;
let skipPreviousButton;
let playlistDeleteButton;
let progressBar;
let getURL;
let shuffle;
let randomNumber;
let found;
let nowPlaying = {
	id: "",
	time: 0
};

function convertTime(sec) {
	// converts seconds into mm:ss and adds leading 0s when necessary
	return `${Math.floor(sec / 60)}:${(
		"0" +
		(sec - Math.floor(sec / 60) * 60)
	).substr(-2)}`;
}

function tickerInterval(action) {
	let interval;
	if (action === "set") {
		interval = setInterval(() => {
			progressBar.value = audio.currentTime;
			let time = Math.floor(audio.currentTime);
			document.getElementById("currentTime").textContent = convertTime(time);
			if (time > 0 && time % 20 == 0) {
				nowPlaying.time = time;
				localStorage.setItem("nowPlaying", JSON.stringify(nowPlaying));
			}
		}, 500);
	} else if (action === "clear") {
		clearInterval(interval);
	}
}

function checkThumbnail(url) {
	// this checks whether a high-res thumbnail exists
	fetch("api/img?url=" + url)
		.then((res) => res.json())
		.then((json) => {
			if (json.status === 200) {
				document.getElementById("thumbnail").src = url;
			} else {
				document.getElementById("thumbnail").src = url.replace(
					"/maxresdefault",
					"/hqdefault"
				);
			}
		});
}

function playSong(url, time) {
	// only swap the source url instead of creating a whole new thing
	tickerInterval("clear");
	audio.pause();
	audio.src = url;
	audio.currentTime = time;
	if (audio.src) {
		// skip button visibility
		for (const entry of document.getElementById("playlistChannel").rows) {
			if (entry.id === audio.src && !entry.nextElementSibling) {
				skipNextButton.style.visibility = "hidden";
			} else if (entry.id === audio.src && entry.nextElementSibling) {
				skipNextButton.style.visibility = "";
			}
			if (entry.id === audio.src && !entry.previousElementSibling) {
				skipPreviousButton.style.visibility = "hidden";
			} else if (entry.id === audio.src && entry.previousElementSibling) {
				skipPreviousButton.style.visibility = "";
			}
		}

		document.getElementById("player").style.display = "initial";

		document.getElementById("thumbnail").style.visibility = "hidden";
		const thumbArr =
			data[url].player_response.videoDetails.thumbnail.thumbnails;
		checkThumbnail(
			thumbArr[thumbArr.length - 1].url.replace("/hqdefault", "/maxresdefault")
		);
		document.getElementById("controls").style.visibility = "hidden";
		progressBar.style.visibility = "hidden";
		document.getElementById("timeStamps").style.visibility = "hidden";

		document.getElementById("nowPlaying").className = "material-icons";
		document.getElementById("nowPlaying").style.fontSize = "54px";
		document.getElementById("nowPlaying").textContent = "cached";

		progressBar.max = data[url].videoDetails.lengthSeconds;
		duration = data[url].videoDetails.lengthSeconds; // audio.duration returns incorrect values

		audio.oncanplay = () => {
			audio.play();
			tickerInterval("set");
			document.getElementById("currentTime").textContent = convertTime(
				Math.floor(audio.currentTime)
			);
			document.getElementById("totalTime").textContent = convertTime(
				data[url].videoDetails.lengthSeconds
			);

			document.getElementById("nowPlaying").className = "";
			document.getElementById("nowPlaying").style.fontSize = "18px";
			document.getElementById(
				"nowPlaying"
			).textContent = `${data[url].videoDetails.title} – ${data[url].videoDetails.author.name}`;

			document.title = data[url].videoDetails.title + " – YT Audio Player";
			document.getElementById("thumbnail").style.visibility = "visible";
			document.getElementById("controls").style.visibility = "visible";
			progressBar.style.visibility = "visible";
			document.getElementById("timeStamps").style.visibility = "visible";
			if (!audio.paused) playButton.textContent = "pause";
		};
	}
}

function skipSong(direction) {
	if (shuffle) {
		do {
			randomNumber = Math.floor(
				Math.random() * document.getElementById("playlistChannel").rows.length
			);
			if (
				document.getElementById("playlistChannel").rows[randomNumber].id !==
				audio.src
			) {
				playSong(
					document.getElementById("playlistChannel").rows[randomNumber].id
				);
				found = true;
			} else found = false;
		} while (!found);
	} else {
		for (const entry of document.getElementById("playlistChannel").rows) {
			if (direction === "fwd") {
				if (entry.id === audio.src && entry.nextElementSibling) {
					playSong(entry.nextElementSibling.id);
					break;
				}
			} else if (direction === "back") {
				if (entry.id === audio.src && entry.previousElementSibling) {
					playSong(entry.previousElementSibling.id);
					break;
				}
			}
		}
	}
}

function getSongOnList(songURL, curTime) {
	function denied() {
		document.getElementById("urlInput").disabled = true;
		document.getElementById("submitButton").disabled = true;
		document.getElementById("submitButton").value = "cancel";
		setTimeout(() => {
			document.getElementById("urlInput").disabled = false;
			document.getElementById("submitButton").disabled = false;
			document.getElementById("submitButton").value = "check";
		}, 1000);
	}
	return fetch("api/get?url=" + songURL)
		.then((res) => res.ok && res.json())
		.then((json) => {
			data[json.directURL] = json.data;
			if (json.directURL !== audio.src) {
				nowPlaying.id = songURL;
				nowPlaying.time = curTime;
				localStorage.setItem("nowPlaying", JSON.stringify(nowPlaying));
				playSong(json.directURL, curTime);
			}
		})
		.catch((err) => {
			denied();
			throw err;
		});
}

function getPlaylistChannel(url) {
	let urlInput;
	try {
		if (url) urlInput = url;
		else {
			urlInput = new URL(document.getElementById("urlInput").value);
			listId = urlInput.searchParams.get("list");
		}
	} catch (err) {
		throw err;
	}

	document.getElementById("submitButton").value = "arrow_downward";
	document.getElementById("urlInput").disabled = true;
	document.getElementById("urlInput").value = "";
	document.getElementById("submitButton").disabled = true;
	return fetch("api/getlist?listId=" + listId)
		.then((res) => res.ok && res.json())
		.then((json) => {
			if (!json) throw new Error("no data");

			localStorage.setItem("playlistChannel", JSON.stringify(json.list));
			items = json.list.items;
			items.forEach((element) => {
				onAddItem(element);
			});
		})
		.catch((err) => {
			denied();
			throw err;
		});
}

function onAddItem(element) {
	const entry = document.getElementById("playlistChannel").insertRow(-1);

	const cell0 = entry.insertCell(0);
	cell0.className = "playlistIndex"; // counter in css
	const cell1 = entry.insertCell(1);
	cell1.id = element.id; // assign video id to this cell
	cell1.textContent = `${element.title} – (${element.duration})`;

	cell1.addEventListener("click", () => {
		if (element.id !== audio.src) getSongOnList(element.id, 0);
	});
	cell1.style.textAlign = "justify";
	cell1.style.cursor = "pointer";

	const deleteButton = document.createElement("i");
	deleteButton.classList.add("material-icons", "deleteButton");
	deleteButton.textContent = "cancel";
	deleteButton.style.cursor = "pointer";
	deleteButton.style.visibility = "hidden";
	deleteButton.addEventListener("click", (e) => {
		delete data[e.target.parentNode.parentNode.id];
		document
			.getElementById("playlistChannel")
			.deleteRow(e.target.parentNode.parentNode.rowIndex);
	});

	const cell2 = entry.insertCell(2);
	cell2.appendChild(deleteButton);

	if (document.getElementById("playlistChannel").rows.length < 2)
		playlistDeleteButton.style.visibility = "hidden";
	if (document.getElementById("playlistChannel").rows.length > 1)
		playlistDeleteButton.style.visibility = "visible";
}

window.onload = async () => {
	document.getElementById("urlInput").value = "";
	document.getElementById("content").style.visibility = "visible";

	getURL = document.getElementById("getURL");
	getURL.onsubmit = (e) => {
		e.preventDefault();
		getPlaylistChannel();
	};
	if (localStorage.getItem("nowPlaying")) {
		let nowPlaying = JSON.parse(localStorage.getItem("nowPlaying"));
		if (nowPlaying.id) {
			getSongOnList(nowPlaying.id, nowPlaying.time);
		}
	}

	playButton = document.getElementById("playButton");
	playButton.addEventListener("click", () => {
		if (playButton.textContent === "pause") {
			audio.pause();
			document.title = "❚❚ " + document.title;
			tickerInterval("clear");
			playButton.textContent = "play_arrow";
		} else {
			audio.play();
			document.title = document.title.replace("❚❚ ", "");
			document.getElementById("currentTime").textContent = convertTime(
				Math.floor(audio.currentTime)
			);
			tickerInterval("set");
			playButton.textContent = "pause";
		}
	});

	thumbnail = document.getElementById("thumbnail");
	thumbnail.addEventListener("click", () => {
		playButton.click();
	});
	thumbnail.style.cursor = "pointer";

	replayButton = document.getElementById("replayButton");
	replayButton.addEventListener("click", () => {
		audio.currentTime = 0;
		document.getElementById("currentTime").textContent = convertTime(
			Math.floor(audio.currentTime)
		);
		progressBar.value = audio.currentTime;
	});

	volumeOffButton = document.getElementById("volumeOffButton");
	volumeOffButton.addEventListener("click", () => {
		if (volumeOffButton.classList.contains("off")) {
			audio.defaultMuted = true;
			audio.muted = true;
			volumeOffButton.classList.replace("off", "on");
			volumeOffButton.style.color = "black";
		} else {
			audio.defaultMuted = false;
			audio.muted = false;
			volumeOffButton.classList.replace("on", "off");
			volumeOffButton.style.color = "gainsboro";
		}
	});

	repeatButton = document.getElementById("repeatButton");
	repeatButton.addEventListener("click", () => {
		if (repeatButton.classList.contains("off")) {
			audio.loop = true;
			repeatButton.classList.replace("off", "on");
			repeatButton.style.color = "black";
		} else {
			audio.loop = false;
			repeatButton.classList.replace("on", "off");
			repeatButton.style.color = "gainsboro";
		}
	});

	shuffleButton = document.getElementById("shuffleButton");
	shuffleButton.addEventListener("click", () => {
		if (shuffleButton.classList.contains("off")) {
			shuffle = true;
			shuffleButton.classList.replace("off", "on");
			shuffleButton.style.color = "black";
		} else {
			shuffle = false;
			shuffleButton.classList.replace("on", "off");
			shuffleButton.style.color = "gainsboro";
		}
	});

	skipNextButton = document.getElementById("skipNextButton");
	skipNextButton.addEventListener("click", () => {
		skipSong("fwd");
	});

	skipPreviousButton = document.getElementById("skipPreviousButton");
	skipPreviousButton.addEventListener("click", () => {
		skipSong("back");
	});

	playlistDeleteButton = document.getElementById("playlistDeleteButton");
	playlistDeleteButton.style.cursor = "pointer";
	playlistDeleteButton.addEventListener("click", () => {
		document.title = "YT Audio Player";
		document.getElementById("playlistChannel").innerHTML = "";
		entries = [];
		data = {};
		localStorage.removeItem("entries");
		playlistDeleteButton.style.visibility = "hidden";
	});

	progressBar = document.getElementById("progressBar");
	progressBar.addEventListener("click", (e) => {
		const percentage = parseFloat(e.offsetX / progressBar.offsetWidth);
		nowPlaying.time = audio.currentTime = Math.floor(
			percentage * audio.duration
		);
		localStorage.setItem("nowPlaying", JSON.stringify(nowPlaying));
	});

	progressBar.addEventListener("mousemove", (e) => {
		const percentage = parseFloat(e.offsetX / progressBar.offsetWidth);
		const previewTime = percentage * audio.duration;
		document.getElementById("position").textContent = convertTime(
			Math.floor(previewTime)
		);
	});

	progressBar.addEventListener("mouseout", (e) => {
		document.getElementById("position").textContent = "";
	});

	if (localStorage.getItem("playlistChannel")) {
		let data = JSON.parse(localStorage.getItem("playlistChannel")).items;
		data.forEach((element) => onAddItem(element));
	}

	audio.addEventListener("ended", () => {
		if (document.getElementById("playlistChannel").rows.length > 1) {
			skipSong("fwd");
		} else {
			document.title = "YT Audio Player";
			playButton.click();
		}
	});
};
