const worker = new Worker('worker.js');

worker.onmessage = function (e) {
    console.log('Sorted array:', e.data);
};

const arrayToSort = Array.from({length: 10000000}, () => Math.floor(Math.random() * 10000));

document.getElementById('sortWebWorkerBtn').addEventListener('click', () => {
    console.log('Sorting was started');
    worker.postMessage(arrayToSort);
});

document.getElementById('actionButton').addEventListener('click', () => {
    console.log('function was called')
});

document.getElementById('noWebWorkerSortBtn').addEventListener('click', () => {
    console.log('Sorting was started without web worker');
    const sortedArray = arrayToSort.sort((a, b) => a - b);
    console.log('Sorted array:', sortedArray);
})