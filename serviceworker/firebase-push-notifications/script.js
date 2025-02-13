firebase.initializeApp({
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
});

const publicVapidKey = "YOUR_PUBLIC_VAPID_KEY";

const messaging = firebase.messaging();

async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        console.error("❌ Service Workers are not supported in this browser.");
        return;
    }

    try {
        console.info("🔄 Registering Service Worker...");
        const registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js",
            { scope: "/" }
        );

        if (!navigator.serviceWorker.controller) {
            await new Promise((resolve) => {
                navigator.serviceWorker.addEventListener("controllerchange", resolve);
            });
        }
        await navigator.serviceWorker.ready;
        console.info("✅ Service Worker registered & ready:", registration);

        return registration;
    } catch (error) {
        console.error("❌ Failed to register Service Worker:", error);
    }
}

async function askPermission() {
    console.log("🔔 Requesting notification permission...");
    await registerServiceWorker();

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        getToken();
    } else {
        console.log("❌ Notification permission denied.");
    }
}

async function getToken() {
    try {
        if (!navigator.serviceWorker.controller) {
            await new Promise((resolve) => {
                navigator.serviceWorker.addEventListener("controllerchange", resolve);
            });
        }
        await navigator.serviceWorker.ready;
        console.log("✅ Confirmed Service Worker is ready before getting FCM token.");

        const token = await messaging.getToken({ vapidKey: publicVapidKey });

        await navigator.clipboard.writeText(token);
        console.info("FCM Token copied to console.");
    } catch (error) {
        console.error("❌ Error getting FCM token:", error);
    }
}

document.getElementById("notify-btn").addEventListener("click", askPermission);