const { createCanvas, loadImage } = require('canvas');
var fs = require('fs');
async function merge(frames, width) {
    console.log(`merging ${frames} frames @ ${width} pixels wide`);
    const canvas = createCanvas(width, frames);
    const ctx = canvas.getContext('2d');
    for (var i = 0; i < frames; i++) {
        var file = "./stuff/";
        file += `MYIMG${(i + 2 + '').padStart(6, '0')}.jpg `;
        const myimg = await loadImage(file);
        ctx.drawImage(myimg, 0, i, canvas.width, 1);
    }
    const out = fs.createWriteStream(__dirname + '/out.png');
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    console.log('done');
}
merge(parseInt(process.argv[2]), parseInt(process.argv[3]));