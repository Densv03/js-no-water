const DB_NAME = "FileDB";
const STORE_NAME = "files";

const dbRequest = indexedDB.open(DB_NAME, 1);

dbRequest.onupgradeneeded = upgradeDb;
dbRequest.onerror = dbRequestError;

function saveFile() {
    const fileInput = document.getElementById("fileInput").files[0];
    if (!fileInput) {
        alert("Please select a file first!");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const fileData = event.target.result;

        const dbRequest = indexedDB.open(DB_NAME, 1);
        dbRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);

            store.put({
                id: 1,
                name: fileInput.name,
                type: fileInput.type,
                data: fileData
            });

            console.log("File saved in IndexedDB:", fileInput.name);
            alert("File saved successfully!");
        };
    };

    reader.readAsDataURL(fileInput);
}

function loadFile() {
    const dbRequest = indexedDB.open(DB_NAME, 1);

    dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);

        const fileRequest = store.get(1);

        fileRequest.onsuccess = () => {
            const file = fileRequest.result;
            if (!file) {
                alert("No file found in IndexedDB!");
                return;
            }

            const fileDisplay = document.getElementById("fileDisplay");
            fileDisplay.innerHTML = `<p>File: ${file.name}</p>`;

            if (file.type.startsWith("image/")) {
                fileDisplay.innerHTML += `<img src="${file.data}" width="300">`;
            } else {
                fileDisplay.innerHTML += `<a href="${file.data}" download="${file.name}">Download File</a>`;
            }
        };
    };
}

function dbRequestError() {
        console.error("Error opening IndexedDB");
}

function upgradeDb(event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
        console.log("Object store created!");
    }

}