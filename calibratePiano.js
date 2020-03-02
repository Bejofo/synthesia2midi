var getPixels = require('get-pixels');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const { Tonal, Scale } = require('@tonaljs/modules');
var MidiWriter = require('midi-writer-js');
var settings = require('./settings.js')
getPixels(`./cal.jpg`, function(err, unpressed) {
    if (err) {
        console.log('Bad image path');
        return;
    }
    console.log('got pixels', unpressed.shape.slice());
    var cords = findRuns(settings.pianoKeyThreshold, unpressed, settings.minPianoKey, settings.pianoKeyTrim);
    debugDrawKey(cords, 'out.png');
    console.log(`${cords.length} keys found`);
    var pianoKeys = cords.length;
    getPixels(`./out.png`, function(err, pixels) {
        if (err) {
            console.log('Bad image path');
            return;
        }
        console.log('out.png loaded', pixels.shape.slice());
        var keyStart = Tonal.note(settings.startingNote).midi;
        var track = new MidiWriter.Track();
        var notesStarted = 0;
        var notesEnded = 0;
        var notesOn = [];
        var notesStart = [];
        for (var row = settings.startingRow; row < pixels.shape.slice()[1]; row += 1) {
            for (var k = 0; k < pianoKeys; k++) {
                var range = cords[k];
                var r = 0;
                var g = 0;
                var b = 0;
                var c = Math.round((range[0] + range[1]) / 2);
                r += pixels.get(c, row, 0);
                g += pixels.get(c, row, 1);
                b += pixels.get(c, row, 2);
                r = Math.round(r);
                g = Math.round(g);
                b = Math.round(b);
                var mid = Math.round((range[0] + range[1]) / 2);
                var pr = unpressed.get(mid, 0, 0);
                var pg = unpressed.get(mid, 0, 1);
                var pb = unpressed.get(mid, 0, 2);
                var index = notesOn.indexOf(k + keyStart);
                if (colorDiff(r, g, b, pr, pg, pb) > settings.keyPressedThreshold) {
                    // note is on
                    if (index == -1) {
                        // Not found
                        notesOn.push(k + keyStart);
                        notesStart.push(row);
                        notesStarted++;
                    }
                } else {
                    // Note is off
                    if (index != -1) {
                        notesOn.splice(index, 1);
                        track.addEvent([
                            new MidiWriter.NoteEvent({
                                pitch: k + keyStart,
                                duration: 'T' + frameToTicks(row - notesStart[index]),
                                startTick: frameToTicks(notesStart[index])
                            })
                        ]);
                        notesStart.splice(index, 1);
                        notesEnded++;
                    }
                }
            }
        }
        console.log(`${notesStarted} notes started`);
        console.log(`${notesEnded} notes ended`);
        var write = new MidiWriter.Writer(track);
        fs.writeFileSync(settings.midiName, write.buildFile(), 'binary');
    });
});

function frameToTicks(x) {
    return Math.round(x / settings.frameRate * (120 / 60) * 128);
}

function findRuns(thres, pixels, runsLength, trim) {
    var currentRun = [];
    var runs = [];
    var cords = [];
    for (var i = 0; i < pixels.shape.slice()[0]; i++) {
        var red = pixels.get(i, 0, 0);
        var green = pixels.get(i, 0, 1);
        var blue = pixels.get(i, 0, 2);
        var pixel = red + green + blue;
        if (i != 0 && Math.abs(currentRun[currentRun.length - 1] - pixel) > thres) {
            runs.push(currentRun);
            if (currentRun.length > runsLength) {
                cords.push([i - currentRun.length + trim, i - trim]);
            }
            currentRun = [];
        }
        currentRun.push(pixel);
    }
    return cords;
}

function debugDrawKey(cords, background) {
    const myimg = loadImage(background);
    myimg
        .then((image) => {
            const canvas = createCanvas(image.width, image.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FF000088';
            cords.forEach((c) => {
                ctx.fillRect((c[0] + c[1]) / 2, 0, 2, 4000);
            });
            const out = fs.createWriteStream(__dirname + '/test.png');
            const stream = canvas.createPNGStream();
            stream.pipe(out);
        })
        .catch((err) => {
            console.log('oh no!', err);
        });
}

function colorDiff(a, b, c, d, e, f) {
    return Math.abs(a - d) + Math.abs(b - e) + Math.abs(c - f);
}