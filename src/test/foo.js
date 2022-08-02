gc();

const startHeapUsed = process.memoryUsage().heapUsed;

// require('../../lib/index-cjs');
// require('entities');
// require('html-entities');
// require('he');
// gc();

console.log((process.memoryUsage().heapUsed - startHeapUsed) / 1024, 'kB');
