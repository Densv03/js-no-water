importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs");
importScripts("https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface");

let model;

async function loadModel() {
    model = await blazeface.load();
    postMessage({status: "model_loaded"});
}

loadModel();

self.onmessage = async function (event) {
    if (!model) {
        postMessage({error: "Model not loaded yet!"});
        return;
    }

    const imageData = event.data;
    const predictions = await model.estimateFaces(imageData, false);
    postMessage(predictions);
};