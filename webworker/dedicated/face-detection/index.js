const video = document.getElementById("video");
const overlayCanvas = document.getElementById("canvas");
const overlayCtx = overlayCanvas.getContext("2d");
const worker = new Worker("face-worker.js");

const captureCanvas = document.createElement("canvas");
captureCanvas.width = overlayCanvas.width;
captureCanvas.height = overlayCanvas.height;
const captureCtx = captureCanvas.getContext("2d");

async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({video: true});
    video.srcObject = stream;
    video.onloadedmetadata = () => {
        video.play();
        processFrame();
    };
}

function processFrame() {
    captureCtx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
    const imageData = captureCtx.getImageData(0, 0, captureCanvas.width, captureCanvas.height);
    worker.postMessage(imageData);

    requestAnimationFrame(processFrame);
}

worker.onmessage = function (event) {
    if (event.data.status === "model_loaded") {
        console.log("Face detection model loaded!");
        return;
    }

    drawFaces(event.data);
};

function drawFaces(predictions) {
    if (!Array.isArray(predictions)) {
        return;
    }

    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    overlayCtx.strokeStyle = "red";
    overlayCtx.lineWidth = 3;

    predictions.forEach((face) => {
        const [x, y] = face.topLeft;
        const [x2, y2] = face.bottomRight;
        const width = x2 - x;
        const height = y2 - y;

        overlayCtx.beginPath();
        overlayCtx.rect(x, y, width, height);
        overlayCtx.stroke();
    });
}

startCamera();