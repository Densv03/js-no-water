console.log("✅ Running ONLINE JavaScript");

const button = document.getElementById('action-button');

button.addEventListener('click', buttonHandler);

function buttonHandler() {
    alert('You are online!');
}