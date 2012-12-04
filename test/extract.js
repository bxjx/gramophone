var test = require('tap').test;
var k = require('../');

var text = "Beep beep is often used in node docs. Another Beep beep from " +
  "node docs. And beep beep is used often.";

test('extract', function(t) {
  t.deepEqual(k.extract(text), ['beep beep', 'node docs']);
  t.end();
});

test('extract with {score: true} as option', function(t){
  var options = { score: true };
  t.deepEqual(k.extract(text, options), [
    {term: 'beep beep', tf: 3},
    {term: 'node docs', tf: 2}
  ]);
  t.end();
});

test('with {limit: number} as option', function(t){
  var options = { limit: 1 };
  t.deepEqual(k.extract(text, options), ['beep beep'], "only top N results");
  t.end();
});

test('with {html: true} as option', function(t){
  var html = "<html><p><strong>Beep beep</strong> is often used in node docs. " +
    "Another <strong>Beep beep</strong> in " +
    "node docs. And beep beep is used often.</p></html>";
  var options = { html: true };
  t.deepEqual(k.extract(html, options), ['beep beep', 'node docs'], "extract from html");
  t.end();
});

test('with {min: number} as option', function(t){
  var opts = { min: 3 };
  t.deepEqual(k.extract(text, opts), ['beep beep'], "only results with frequency greater than N");
  t.end();
});

test('with {ngrams: number} as option', function(t){
  var text = "test node code. And test and node and code and node. And test node code test node";
  var options = { ngrams: 2 };
  var results = k.extract(text, options);
  t.deepEqual(results, ['test node', 'node code'], 'only phrases of 2 words');
  t.end();
});

test('with {ngrams: list} as option', function(t){
  var text = "test node code. And test and node and code and node. And test node code";
  var options = { ngrams: [3] };
  var results = k.extract(text, options);
  t.deepEqual(results, ['test node code'], 'only phrases of 3 ngrams/words');
  t.end();
});

test('with {stopWords: [word]} as option', function(t){
  var options = { stopWords: ['beep'] };
  var results = k.extract(text, options);
  t.deepEqual(results, ['node docs'], 'remove all phrases with stopWords');
  t.end();
});

test('with {stem: true} as option', function(t){
  var text = "I have really smart colleagues. I am a colleague. I like colleague.";
  var options = { stem: true, score: true };
  var results = k.extract(text, options);
  t.deepEqual(results, [{ term: 'colleague', tf: 3}], 'use stemming');
  t.end();
});

test('with {startWords: [word]} as option', function(t){
  var options = { startWords: ['often'] };
  var results = k.extract(text, options);
  t.ok(results.indexOf('often') !== -1, 'keep any startWords');
  t.end();
});

test('with {ngram: number} as option', function(t){
  var text = "test node code. And test and node and code and node. And test node code";
  var options = { ngrams: [3] };
  var results = k.extract(text, options);
  t.deepEqual(results, ['test node code'], 'only phrases of 3 ngrams/words or more');
  t.end();
});

test('with {cutoff: float} as option', function(t){
  var text = "Node is similar in design to and influenced by systems like " +
    "Ruby's Event Machine or Python's Twisted. Node takes the event model a " +
    "bit further—it presents the event loop as a language construct instead " +
    "of as a library. In other systems there is always a blocking call to " +
    "start the event-loop...";

  t.test('that is larger than phrase freq/component phrase frequency', function(t){
    var results = k.extract(text, { cutoff: 0.9 });
    t.ok(results.indexOf('event') === -1, "should remove component phrases");
    t.end();
  });

  t.test('that is less than phrase freq/component phrase frequency', function(t){
    var results = k.extract(text, { cutoff: 0.1 });
    t.ok(results.indexOf('event') !== -1, "should not remove the component phrases");
    t.end();
  });

  t.end();
});
