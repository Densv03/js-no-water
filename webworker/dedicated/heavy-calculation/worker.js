self.onmessage = function (e) {
    const sortedArray = e.data.sort((a, b) => a - b);
    self.postMessage(sortedArray);
};