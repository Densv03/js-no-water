importScripts("https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js");

self.onmessage = function (event) {
    const {imageData, width, height} = event.data;

    const code = jsQR(imageData.data, width, height, {
        inversionAttempts: "dontInvert",
    });

    if (code) {
        postMessage({
            success: true,
            data: code.data,
            location: code.location,
            binaryData: Array.from(code.binaryData),
        });
        console.log(code);
    } else {
        postMessage({success: false});
    }
};
