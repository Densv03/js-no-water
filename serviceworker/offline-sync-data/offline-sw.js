self.addEventListener("install", event => {
    console.log("🔄 Service Worker Installed");
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    console.log("✅ Service Worker Activated");
    return self.clients.claim();
});

self.addEventListener("sync", async event => {
    if (event.tag === "sync-feedback") {
        event.waitUntil(syncFeedback());
    }
});

async function syncFeedback() {
    console.log("🔄 Syncing feedback data...");

    const feedbackData = await getAllFromIndexedDB();
    for (const feedback of feedbackData) {
        try {
            const response = await fetch("https://echo.free.beeceptor.com", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(feedback)
            });

            if (response.ok) {
                console.log("✅ Successfully sent:", feedback, (await self.clients.matchAll()).length);
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        console.log("✅ Sending message to client");
                        client.postMessage({ type: "SYNC_SUCCESS" });
                    });
                });
                await deleteFromIndexedDB(feedback.timestamp);
            }
        } catch (error) {
            console.error("❌ Failed to sync feedback:", error);
        }
    }
}

function getAllFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("sync-db", 1);
        request.onsuccess = event => {
            const db = event.target.result;
            const transaction = db.transaction("feedback", "readonly");
            const store = transaction.objectStore("feedback");
            const getRequest = store.getAll();
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject(getRequest.error);
        };
    });
}

function deleteFromIndexedDB(timestamp) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("sync-db", 1);
        request.onsuccess = event => {
            const db = event.target.result;
            const transaction = db.transaction("feedback", "readwrite");
            const store = transaction.objectStore("feedback");
            store.delete(timestamp);
            resolve();
        };
        request.onerror = () => reject(request.error);
    });
}