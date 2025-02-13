if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("offline-sw.js").then(reg => {
        console.log("✅ Service Worker registered:", reg);
    }).catch(error => {
        console.error("❌ Service Worker registration failed:", error);
    });
}

function updateNetworkStatus() {
    const statusElement = document.getElementById("network-status");
    if (navigator.onLine) {
        statusElement.textContent = "✅ You are online";
        statusElement.classList.add("online");
        statusElement.classList.remove("offline");
    } else {
        statusElement.textContent = "⚠️ You are offline";
        statusElement.classList.add("offline");
        statusElement.classList.remove("online");
    }
}

window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);
updateNetworkStatus();

document.getElementById("feedback-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const message = document.getElementById("message").value;

    const feedback = { name, message, timestamp: new Date().toISOString() };

    if (navigator.onLine) {
        sendToServer(feedback);
    } else {
        saveToIndexedDB(feedback).then(() => {
            navigator.serviceWorker.ready.then(swRegistration => {
                return swRegistration.sync.register("sync-feedback");
            });
        });

        document.getElementById("sync-status").textContent = "⚠️ You are offline. Your message will be sent when you go online.";
    }
});

async function sendToServer(data) {
    try {
        const response = await fetch("https://echo.free.beeceptor.com", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            document.getElementById("sync-status").textContent = "✅ Feedback sent successfully!";
        } else {
            throw new Error("Server error");
        }
    } catch (error) {
        console.error("❌ Error sending feedback:", error);
        document.getElementById("sync-status").textContent = "❌ Failed to send feedback.";
    }
}

function saveToIndexedDB(data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("sync-db", 1);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("feedback")) {
                db.createObjectStore("feedback", { keyPath: "timestamp" });
            }
        };

        request.onsuccess = event => {
            const db = event.target.result;
            const transaction = db.transaction("feedback", "readwrite");
            const store = transaction.objectStore("feedback");
            store.add(data);
            resolve();
        };

        request.onerror = () => reject(request.error);
    });
}

navigator.serviceWorker.addEventListener("message", event => {
    if (event.data.type === "SYNC_SUCCESS") {
        console.log("✅ Background sync completed.");
        clearSyncMessage();
    }
});

function clearSyncMessage() {
    document.getElementById("sync-status").textContent = "";
}
