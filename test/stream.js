var test = require('tap').test;
var k = require('../');

test('stream', function(t){
  var stream = k.stream();
  var keywords = [];
  stream.on('data', function(data){
    keywords.push(data);
  });
  stream.on('end', function(data){
    t.deepEqual(keywords, ['beep beep']);
    t.end();
  });
  stream.write('beep beep '); 
  stream.write('and beep beep '); 
  stream.write('and oh no'); 
  stream.end();
});
