const form = document.getElementById("user-form");
const inputs = form.querySelectorAll("input");

window.onload = () => {
    inputs.forEach(input => {
        const savedValue = sessionStorage.getItem(input.name);
        if (savedValue) {
            input.value = savedValue;
        }
    });
};

inputs.forEach(input => {
    input.addEventListener("input", () => {
        sessionStorage.setItem(input.name, input.value);
    });
});