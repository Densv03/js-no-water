const sessionStorageForm = document.getElementById('session-storage-form');

const getSessionStorageValueForm = document.getElementById('get-session-storage-data');
const sessionStorageValueParagraph = document.getElementById('session-storage-get-value');

const removeSessionStorageValueForm = document.getElementById('remove-session-storage-data');

const clearStorageBtn = document.getElementById('clear-storage-btn');

sessionStorageForm.addEventListener('submit', e => {
    handleForm(e, saveSessionStorageData);
});

getSessionStorageValueForm.addEventListener('submit', e => {
    handleForm(e, getSessionStorageData)
});

removeSessionStorageValueForm.addEventListener('submit', e => {
    handleForm(e, removeSessionStorageData);
});

clearStorageBtn.addEventListener('click', clearStorage);

function saveSessionStorageData() {
    const {
        'session-storage-key': sessionStorageKey, 'session-storage-value': sessionStorageValue
    } = getFormValues(sessionStorageForm);
    sessionStorage.setItem(sessionStorageKey, sessionStorageValue);
    sessionStorageForm.reset();
}

function getSessionStorageData() {
    const {'session-storage-get-key': sessionStorageKey} = getFormValues(getSessionStorageValueForm);
    const sessionStorageValue = sessionStorage.getItem(sessionStorageKey);

    if (!sessionStorageValue) {
        sessionStorageValueParagraph.textContent = 'No data was found';
        return;
    }

    sessionStorageValueParagraph.textContent = sessionStorageValue;
}

function removeSessionStorageData() {
    const {'session-storage-remove-key': sessionStorageKey} = getFormValues(removeSessionStorageValueForm);

    sessionStorage.removeItem(sessionStorageKey);

    removeSessionStorageValueForm.reset();
}

function clearStorage() {
    sessionStorage.clear();
}

function getFormValues(formElement) {
    const formData = new FormData(formElement);
    const dataObject = {};

    formData.forEach((value, key) => {
        dataObject[key] = value;
    });

    return dataObject;
}

function handleForm(event, callback) {
    event.preventDefault();

    callback();
}