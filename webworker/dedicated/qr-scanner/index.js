const CONFIG = {
    CAMERA: {
        video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    },
    QR_DECODE: {
        inversionAttempts: "dontInvert",
        avgDecodeTimeWindow: 10
    },
    UI: {
        fpsUpdateInterval: 1000,
        buttonActiveDuration: 2000,
        minLineWidth: 3,
        minDotRadius: 6
    },
    CLASSES: {
        active: 'active',
        error: 'error',
        scanning: 'scanning',
        qrFound: 'qr-found',
        qrData: 'qr-data',
        link: 'link',
        text: 'text',
        copyBtn: 'copy-btn'
    }
};

class QRScannerApp {
    constructor() {
        this.initializeElements();
        this.initializeState();
        this.initializeEventListeners();
        this.start();
    }

    initializeElements() {
        this.elements = {
            video: document.getElementById("video"),
            overlayCanvas: document.getElementById("canvas"),
            overlayCtx: document.getElementById("canvas").getContext("2d"),
            resultDiv: document.getElementById("result"),
            mainThreadBtn: document.getElementById("mainThreadBtn"),
            workerThreadBtn: document.getElementById("workerThreadBtn"),
            modeDisplay: document.getElementById("modeDisplay"),
            decodeTimeDisplay: document.getElementById("decodeTime"),
            fpsDisplay: document.getElementById("fps")
        };

        this.captureCanvas = document.createElement("canvas");
        this.captureCtx = this.captureCanvas.getContext("2d");
    }

    initializeState() {
        this.state = {
            isProcessing: false,
            lastQRCode: null,
            useWorker: false,
            decodeStartTime: 0,
            frameCount: 0,
            lastFpsUpdate: performance.now(),
            currentFps: 0,
            decodeTimeSum: 0,
            decodeTimeCount: 0,
            animationId: null,
            stream: null
        };

        this.worker = new Worker("qr-worker.js");
    }

    initializeEventListeners() {
        this.elements.mainThreadBtn.addEventListener('click', () => this.setMode(false));
        this.elements.workerThreadBtn.addEventListener('click', () => this.setMode(true));

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.handleResize(), 250);
        });

        this.worker.onmessage = (event) => this.handleWorkerResult(event);

        window.addEventListener('beforeunload', () => this.cleanup());
    }

    async start() {
        this.updateUI('Scanning for QR codes...', 'scanning');
        this.setMode(false);
        await this.startCamera();
    }

    async startCamera() {
        try {
            this.state.stream = await navigator.mediaDevices.getUserMedia(CONFIG.CAMERA);
            this.elements.video.srcObject = this.state.stream;
            
            await new Promise(resolve => {
                this.elements.video.onloadedmetadata = resolve;
            });

            this.setupCanvases();
            this.elements.video.play();
            this.processFrame();
        } catch (error) {
            console.error("Camera initialization failed:", error);
            this.updateUI('Camera access denied or not available', 'error');
        }
    }

    setupCanvases() {
        const { videoWidth, videoHeight } = this.elements.video;
        
        [this.elements.video, this.elements.overlayCanvas, this.captureCanvas].forEach(canvas => {
            canvas.width = videoWidth;
            canvas.height = videoHeight;
        });
    }

    processFrame() {
        if (!this.state.isProcessing) {
            this.captureFrame();
            this.decodeFrame();
        }

        this.updateFPS();
        this.state.animationId = requestAnimationFrame(() => this.processFrame());
    }

    captureFrame() {
        this.captureCtx.drawImage(
            this.elements.video, 
            0, 0, 
            this.captureCanvas.width, 
            this.captureCanvas.height
        );
    }

    decodeFrame() {
        const imageData = this.captureCtx.getImageData(
            0, 0, 
            this.captureCanvas.width, 
            this.captureCanvas.height
        );

        this.state.isProcessing = true;
        this.state.decodeStartTime = performance.now();

        if (this.state.useWorker) {
            this.worker.postMessage({
                imageData: imageData,
                width: this.captureCanvas.width,
                height: this.captureCanvas.height
            });
        } else {
            this.decodeInMainThread(imageData);
        }
    }

    decodeInMainThread(imageData) {
        try {
            const code = jsQR(
                imageData.data, 
                this.captureCanvas.width, 
                this.captureCanvas.height, 
                CONFIG.QR_DECODE
            );

            const decodeTime = performance.now() - this.state.decodeStartTime;
            this.updateDecodeTime(decodeTime);

            if (code) {
                this.handleQRResult({
                    success: true,
                    data: code.data,
                    location: code.location
                });
            } else {
                this.handleQRResult({ success: false });
            }
        } catch (error) {
            console.error("QR decode error:", error);
            this.handleQRResult({ success: false });
        } finally {
            this.state.isProcessing = false;
        }
    }

    handleWorkerResult(event) {
        const decodeTime = performance.now() - this.state.decodeStartTime;
        this.updateDecodeTime(decodeTime);
        this.handleQRResult(event.data);
        this.state.isProcessing = false;
    }

    handleQRResult(result) {
        if (result.success) {
            this.state.lastQRCode = result;
            this.updateUI(this.formatQRResult(result.data), 'qr-found');
            this.drawQRBoundingBox(result.location);
        } else {
            this.clearOverlay();
            if (this.state.lastQRCode) {
                this.updateUI('Scanning for QR codes...', 'scanning');
                this.state.lastQRCode = null;
            }
        }
    }

    updateFPS() {
        this.state.frameCount++;
        const now = performance.now();
        
        if (now - this.state.lastFpsUpdate >= CONFIG.UI.fpsUpdateInterval) {
            this.state.currentFps = Math.round(
                (this.state.frameCount * 1000) / (now - this.state.lastFpsUpdate)
            );
            this.elements.fpsDisplay.textContent = this.state.currentFps;
            this.state.frameCount = 0;
            this.state.lastFpsUpdate = now;
        }
    }

    updateDecodeTime(time) {
        this.state.decodeTimeSum += time;
        this.state.decodeTimeCount++;

        if (this.state.decodeTimeCount >= CONFIG.QR_DECODE.avgDecodeTimeWindow) {
            const avgTime = Math.round(this.state.decodeTimeSum / this.state.decodeTimeCount);
            this.elements.decodeTimeDisplay.textContent = `${avgTime}ms`;
            this.state.decodeTimeSum = 0;
            this.state.decodeTimeCount = 0;
        }
    }

    drawQRBoundingBox(location) {
        const { overlayCtx, overlayCanvas } = this.elements;
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        const lineWidth = Math.max(CONFIG.UI.minLineWidth, overlayCanvas.width / 200);
        const dotRadius = Math.max(CONFIG.UI.minDotRadius, overlayCanvas.width / 100);

        this.drawPolygon(overlayCtx, location, 'rgba(0, 255, 0, 0.1)', 0, null);

        this.drawPolygon(overlayCtx, location, null, lineWidth, '#00ff00');

        this.drawCornerDots(overlayCtx, location, dotRadius);
    }

    drawPolygon(ctx, location, fillStyle, lineWidth, strokeStyle) {
        ctx.beginPath();
        ctx.moveTo(location.topLeftCorner.x, location.topLeftCorner.y);
        ctx.lineTo(location.topRightCorner.x, location.topRightCorner.y);
        ctx.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y);
        ctx.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y);
        ctx.closePath();

        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }

        if (lineWidth && strokeStyle) {
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }
    }

    drawCornerDots(ctx, location, radius) {
        const corners = [
            location.topLeftCorner,
            location.topRightCorner,
            location.bottomRightCorner,
            location.bottomLeftCorner
        ];

        corners.forEach(corner => {
            ctx.beginPath();
            ctx.arc(corner.x, corner.y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#00ff00';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(corner.x, corner.y, radius - 2, 0, 2 * Math.PI);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    clearOverlay() {
        this.elements.overlayCtx.clearRect(
            0, 0, 
            this.elements.overlayCanvas.width, 
            this.elements.overlayCanvas.height
        );
    }

    formatQRResult(data) {
        const isURL = this.isValidURL(data);
        const escapedData = this.escapeHtml(data);
        const type = isURL ? 'Link' : 'Text';
        const icon = isURL ? '🔗' : '📝';

        return `
            <div class="${CONFIG.CLASSES.qrFound}">
                <strong>${icon} ${type} Detected!</strong>
                <div class="${CONFIG.CLASSES.qrData} ${isURL ? CONFIG.CLASSES.link : CONFIG.CLASSES.text}">
                    ${isURL ? 
                        `<a href="${escapedData}" target="_blank" rel="noopener noreferrer">${escapedData}</a>` : 
                        escapedData
                    }
                </div>
                <button class="${CONFIG.CLASSES.copyBtn}" onclick="app.copyToClipboard('${escapedData.replace(/'/g, "\\'")}')">
                    📋 Copy ${type}
                </button>
            </div>
        `;
    }

    isValidURL(text) {
        try {
            const url = new URL(text);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showCopySuccess();
        } catch (error) {
            console.error('Failed to copy:', error);
            this.showCopyError();
        }
    }

    showCopySuccess() {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.style.background = '#38a169';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, CONFIG.UI.buttonActiveDuration);
    }

    showCopyError() {
        alert('Failed to copy to clipboard');
    }

    updateUI(content, className) {
        this.elements.resultDiv.innerHTML = `<span class="${className}">${content}</span>`;
    }

    setMode(useWorker) {
        this.state.useWorker = useWorker;
        
        this.elements.mainThreadBtn.classList.toggle(CONFIG.CLASSES.active, !useWorker);
        this.elements.workerThreadBtn.classList.toggle(CONFIG.CLASSES.active, useWorker);
        
        const mode = useWorker ? 'Web Worker' : 'Main Thread';
        const color = useWorker ? '#38a169' : '#e53e3e';
        this.elements.modeDisplay.textContent = mode;
        this.elements.modeDisplay.style.color = color;
        
        this.resetMetrics();
    }

    resetMetrics() {
        this.state.frameCount = 0;
        this.state.lastFpsUpdate = performance.now();
        this.state.decodeTimeSum = 0;
        this.state.decodeTimeCount = 0;
        this.elements.decodeTimeDisplay.textContent = '0ms';
        this.elements.fpsDisplay.textContent = '0';
    }

    handleResize() {
        if (this.elements.video.videoWidth && this.elements.video.videoHeight) {
            this.setupCanvases();
        }
    }

    cleanup() {
        if (this.state.animationId) {
            cancelAnimationFrame(this.state.animationId);
        }

        if (this.state.stream) {
            this.state.stream.getTracks().forEach(track => track.stop());
        }

        if (this.worker) {
            this.worker.terminate();
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    window.app = new QRScannerApp();
});