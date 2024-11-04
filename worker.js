// worker.js
const { parentPort } = require("worker_threads");

let counter = 0;
for (let i = 1; i < 100000000000000000; i++) { // Yeh loop heavy computation hai
    counter++;
}

parentPort.postMessage(counter); // Result ko parent thread tak bhejna
