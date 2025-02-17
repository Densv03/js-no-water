const DB_NAME = "UserDB";
const STORE_NAME = "users";

const dbRequest = indexedDB.open(DB_NAME, 1);

dbRequest.onupgradeneeded = upgradeDb;
dbRequest.onerror = dbRequestError;
window.onload = loadUsers;

document.getElementById("userForm").addEventListener("submit", submitForm);

function loadUsers() {
    const dbRequest = indexedDB.open(DB_NAME, 1);

    dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);

        const userList = document.getElementById("userList");
        userList.innerHTML = "";

        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const user = cursor.value;
                const li = document.createElement("li");
                li.innerHTML = `
                    ${user.name} (${user.email}) 
                    <button onclick="editUser(${user.id})">Edit</button>
                    <button onclick="deleteUser(${user.id})">Delete</button>
                `;
                userList.appendChild(li);
                cursor.continue();
            }
        };
    };
}

function editUser(id) {
    const dbRequest = indexedDB.open(DB_NAME, 1);
    dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);

        const request = store.get(id);
        request.onsuccess = () => {
            const user = request.result;
            if (user) {
                document.getElementById("userId").value = user.id;
                document.getElementById("userName").value = user.name;
                document.getElementById("userEmail").value = user.email;
            }
        };
    };
}

function deleteUser(id) {
    const dbRequest = indexedDB.open(DB_NAME, 1);
    dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        store.delete(id);
        transaction.oncomplete = () => {
            console.log(`User with ID ${id} deleted`);
            loadUsers();
        };
    };
}

function submitForm(event) {
    event.preventDefault();

    const id = document.getElementById("userId").value;
    const name = document.getElementById("userName").value;
    const email = document.getElementById("userEmail").value;

    const dbRequest = indexedDB.open(DB_NAME, 1);
    dbRequest.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        const user = { name, email };
        if (id) {
            user.id = Number(id);
            store.put(user);
        } else {
            store.add(user);
        }

        transaction.oncomplete = () => {
            console.log("User saved!");
            document.getElementById("userForm").reset();
            document.getElementById("userId").value = "";
            loadUsers();
        };
    };
}

function dbRequestError() {
    console.error("Error opening IndexedDB");
}

function upgradeDb(event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        console.log("Object store created!");
    }

}