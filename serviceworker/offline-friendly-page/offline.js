console.log("⚠️ Running OFFLINE JavaScript");
document.body.innerHTML += "<p>⚠️ You are OFFLINE! Some features may be unavailable.</p>";

const button = document.getElementById('action-button');
button.addEventListener('click', buttonHandler);

function buttonHandler() {
    alert('You are offline!');
}