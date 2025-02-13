document.getElementById("notify-btn").addEventListener("click", sendNotification)

function sendNotification () {
    if (!("Notification" in window)) {
        alert("This browser does not support notifications.");
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            new Notification("🚀 New Notification!", {
                body: "This is a mock push notification!",
                icon: "https://cdn-icons-png.flaticon.com/512/1827/1827346.png",
                vibrate: [200, 100, 200],
            });
        } else {
            alert("You denied notification permissions!");
        }
    });
}