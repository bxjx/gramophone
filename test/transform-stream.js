var test = require('tap').test;
var k = require('../');

test('transformStream reading from a text stream', function(t){
  var stream = k.transformStream();
  var keywords = [];
  stream.on('end', function(){ t.end(); });
  stream.on('data', function(data){
    t.deepEqual(data, ['beep beep']);
  });
  stream.write('beep beep and oh no and beep beep'); 
  stream.end();
});

test('transformStream reading from an object stream with from and to set', function(t){
  var stream = k.transformStream({ from: 'from', to: 'to' });
  var keywords = [];
  stream.on('end', function(){ t.end(); });
  stream.on('data', function(data){
    t.deepEqual(data.to, ['beep beep']);
  });
  stream.write({ from: 'beep beep and oh no and beep beep' }); 
  stream.end();
});
