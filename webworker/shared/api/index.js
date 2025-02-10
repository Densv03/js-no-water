const worker = new SharedWorker("api-worker.js");
worker.port.start();

const dataContainer = document.getElementById("data");
const refreshBtn = document.getElementById("refresh-btn");

worker.port.onmessage = function(event) {
    if (event.data.type === "data") {
        console.log("Data received:", event.data.data);
        displayData(event.data.data);
    }
};

function requestData() {
    worker.port.postMessage("getData");
    console.log("Requesting data...");
}

function displayData(posts) {
    dataContainer.innerHTML = posts.map(post => `<p><strong>${post.title}</strong><br>${post.body}</p>`).join("");
}

refreshBtn.addEventListener("click", requestData);

requestData();