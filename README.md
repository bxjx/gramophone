Gramophone
==========

[![Build Status](https://secure.travis-ci.org/bxjx/gramophone.png?branch=master)](https://travis-ci.org/bxjx/gramophone)

Extracts most frequently used keywords and phrases from text. It excludes
common stop words. It can be configured to extract arbitary length phrases
(ngrams) rather than just keywords.

```js
request('https://github.com/substack/stream-handbook/blob/master/readme.markdown')
  .pipe(gramophone.stream({ngrams: 2, html: true, limit: 2}))
  .on('data', console.error.bind(console));
```

Would write out:
```
readable stream
writable stream
```

API
---

  * <a href="#extract"><code>gramophone.<b>extract()</b></code></a>
  * <a href="#stream"><code>gramophone.<b>stream()</b></code></a>
  * <a href="#transformStream"><code>gramophone.<b>transformStream()</b></code></a>

--------------------------------------------------------
<a name="extract"></a>
### gramophone.extract(text[, options])

Synchronously extracts keywords from the text. By
default it returns any keyword phrases that occur more than once. It also
removes any common English words. It returns the results reverse ordered by
frequency i.e. the first result is the most common phrase.

```js
keyword.extract('beep beep and foo bar and beep beep and beep beep and foo bar')
```

Returns `['beep beep', 'foo bar']`.

#### Option: score

Returns each keyword as an object where `term` is the keyword and `tf` is the
number of times the phrase was used i.e. the term frequency. Off by default.

```js
keyword.extract('beep beep and foo bar and beep beep and beep beep and foo bar', {score: true})
```

Returns `[{term: 'beep beep', tf: 3}, {term: 'foo bar', tf: 2}]`.

#### Option: limit

Returns the top N results. The default is to not limit the results.

```js
keyword.extract('beep beep and foo bar and beep beep and beep beep and foo bar', {limit: 1})
```

Returns `['beep beep']`.

#### Option: flatten

Returns all occurrences of the ngram. Useful for passing data to Natural's
TF-IDF function. Note: the original order is not maintained. Off by default.

```js
keyword.extract('beep beep and foo bar and beep beep and beep beep and foo bar', {flaten: true})
```

Returns `['beep beep', 'beep beep', 'beep beep', 'foo bar', 'foo bar']`.

#### Option: html

Extracts the keywords from html text elements. The default is false.

```js
keyword.extract('<strong>beep</strong>, <strong>beep</strong> and <strong>foo</strong>', {html: true})
```

Returns `['beep', 'foo']`.

#### Option: min

Only returns results with greater than or equal to N occurences. The default value is 2.

```js
keyword.extract('beep and beep and beep and foo and foo', {min: 3})
```

Returns `['beep']`.

#### Option: ngrams

If ngrams is a number (N), only look for phrases with N words. If ngrams is
a list ([N1, N2]), only look for the phrases with N1 or N2 words etc.. The
defualt is too look for [1, 2, 3] word ngrams.

```js
keyword.extract('beep and beep and beep bop boop and foo and foo bar', {ngrams: [2, 3]})
```

Returns `['beep bop boop', 'foo bar']`.

#### Option: stopWords

Add extra stopWords to be used in addition to the English set.

```js
keyword.extract('foo et bar et foo et bar et foo', {stopWords: ['et']})
```

Returns `['foo', 'bar']`.

#### Option: startWords

Any words in this list are whitelisted even if they are a stop word.

```js
keyword.extract('foo and bar with foo and bar', {startWords: ['and']})
```

Returns `['foo and bar']`

#### Option: stem

Apply stemming before extracting keywords. The returned keyword will be the
most frequently used word.

```js
keyword.extract('fooing and foo and fooing', {stem: true})
```

Returns `['fooing']`

#### Option: cutoff

Allows you to specify the cutoff for determining whether to include a phrase
that is a component of another phrase. E.g. should "node" and "runs" be
extracted as keywords as well as "node runs".

A component phrase is filtered based on the following formula:

` phrase freq. / component phrase freq. >= 1 - cutoff`

E.g., let's say you have some text that includes the phrase "node runs" 20 times,
"node" 40 times and "runs" 22 times. If the cutoff was 0.5 (the default),
"node" would be included as `20 / 40 >= 1 - 0.5`. However, "runs" would not
be returned as a keyword as `20 / 22 < 1 - 0.5`.

Wow. I could probably make this more intuitive. Open to suggestions.

--------------------------------------------------------
<a name="stream"></a>
### gramophone.stream([options])

Returns a through stream that reads in the text stream and emits keywords
based on the options passed. It uses the same options as `extract`. Note: this
stream behaves like a sink and will buffer the stream completely before emitting
keywords.

See first example.

--------------------------------------------------------
<a name="transformStream"></a>
### gramophone.transformStream([options])

Returns a through stream that reads in the stream and emits keywords for each
data read. By default, it assumes that each data read in a string. Alternatively
the stream can read and write to objects. To read
the text from an object property, specify the `from` option. If you want to
write the keywords back to the object, also specify the `to` option.

```js
var stream = gramophone.transformStream({from: 'text', to: 'keywords'});
stream.write({ text: 'foo and bar and foo'});
stream.end();
```

Emits the data: `{ text: 'foo and bar and foo', keywords: [foo] }`.

Related projects
----------------

  * [node-alchemy](https://github.com/framingeinstein/node-alchemy): 
    a cloud based keyword extraction service.
  * [natural](https://github.com/NaturalNode/natural): a fantastic natural
    language processing library for node.js. Checkout
    [Tf-Idf](https://github.com/NaturalNode/natural#tf-idf) if you're looking
    to extract keywords based on their relative frequency to other documents.
    If people are interested, I might add Tf-Idf support to gramophone.

Licence & copyright
-------------------

gramophone is Copyright (c) 2012 B.J. Rossiter.

gramophone is licensed under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.
