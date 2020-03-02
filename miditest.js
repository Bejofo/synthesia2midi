var fs = require('fs');
var Midi = require('jsmidgen');

var file = new Midi.File();
var track = new Midi.Track();
file.addTrack(track);
var c = 0;
for(var i = 0; i < 1000; i++){
	track.addNoteOn(0, c+30, i*64);
	track.addNoteOff(0, c+30, 64);
	console.log([i*64,i*64+64])
	c++;
	c%=30;
}

fs.writeFileSync('test.mid', file.toBytes(), 'binary');