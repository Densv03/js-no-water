let connections = [];
let latestData = null;
let lastFetchTime = 0;

async function fetchData() {
    try {
        console.log("Fetching data from API...");
        const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
        latestData = await response.json();
        lastFetchTime = Date.now();
        console.log("Data fetched:", latestData);

        connections.forEach(port => port.postMessage({ type: "data", data: latestData }));
    } catch (error) {
        console.error("API fetch error:", error);
    }
}

self.onconnect = function(event) {
    const port = event.ports[0];
    connections.push(port);

    port.onmessage = function(event) {
        if (event.data === "getData") {
            const now = Date.now();
            if (!latestData || now - lastFetchTime > 10000) {
                fetchData();
            } else {
                port.postMessage({ type: "data", data: latestData });
            }
        }
    };

    port.start();
};