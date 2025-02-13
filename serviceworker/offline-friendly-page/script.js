if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(() => {
        console.log("✅ Service Worker registered successfully");
    }).catch(error => {
        console.error("❌ Service Worker registration failed:", error);
    });
}

function loadScript(scriptName) {
    const script = document.createElement("script");
    script.src = scriptName;
    document.body.appendChild(script);
}

if (navigator.onLine) {
    loadScript("online.js");
} else {
    loadScript("offline.js");
}

window.addEventListener("online", () => location.reload());
window.addEventListener("offline", () => location.reload());