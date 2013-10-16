var _ = require('lodash');
var natural = require('natural');
var util = require('util');
var stopWords = require('./stopwords.json');
var es = require('event-stream');
var Stream = require('stream');
var stripTags = require('underscore.string').stripTags;

// Extract the most frequently used phrases from the text.
exports.extract = function(text, options){
  var results = [];
  var keywords = {};
  var combined, combinedResults = {};
  var unstemmed = {};

  var stem = function(word){
    // only bother stemming if the word will be used
    if (!usePhrase(word, options)) return word;
    var stem = natural.PorterStemmer.stem(word);
    // Store the shortest word that matches this stem for later destemming
    if (!unstemmed.hasOwnProperty(stem) || word.length < unstemmed[stem].length){
      unstemmed[stem] = word;
    }
    return stem;
  };

  var destem = function(stem){
    return unstemmed[stem];
  };

  if (!text) return [];
  if (typeof text !== 'string') text = text.toString();
  
  if (!options) options = {};
  if (!options.ngrams){
    options.ngrams = [1, 2, 3];
  }else if (typeof options.ngrams === 'number'){
    options.ngrams = [options.ngrams];
  }
  if (!options.cutoff) options.cutoff = 0.5;
  if (!options.min) options.min = 2; 
  if (!options.stopWords) options.stopWords = [];
  if (!options.startWords) options.startWords = [];
  if (options.html){
    text = stripTags(text);
  }

  // For each ngram, extract the most frequent phrases (taking into account
  // stop and start words lists)
  _.each(options.ngrams, function(ngram){
    var keywordsForNgram;
    var tf = new Tf();
    var tokenized = _.map(natural.NGrams.ngrams(text, ngram), function(ngram){
      if (options.stem){
        ngram = _.map(ngram, stem);
      }
      return ngram.join(' ').toLowerCase();
    });
    tf.addDocument(tokenized);
    keywordsForNgram = tf.listMostFrequestTerms(0);
    keywordsForNgram = _.select(keywordsForNgram, function(item){
      return usePhrase(item.term, options);
    });
    results = results.concat(keywordsForNgram);
  });

  // Convert results to a hash
  _.each(results, function(result){
    combinedResults[result.term] = result.tf;
  });
  
  // Combine results from each ngram to remove redundancy phrases
  combined = exports.combine(combinedResults, options.cutoff);
  
  // Convert to a list of objects sorted by tf (term frequency)
  combined = _.chain(combined) 
    .pairs()
    .sortBy(_.last)
    .reverse()
    .map(function(combination){ return {term: combination[0], tf: combination[1] }; })
    .value();
  
  // Only return results over a given frequency (default is 2 or more)
  if (options.min){
    combined = _.select(combined, function(result){
      return result.tf >= options.min;
    });
  }

  // If stemming was used, remap words back
  if (options.stem){
    combined.forEach(function(result){
      result.term = _.map(result.term.split(' '), destem).join(' ');
    });
  }

  if (options.flatten){
    // Flatten the results so that there is a list item for every occurence of
    // the term
    combined = _.flatten(
      _.map(combined, function(result){
        var flattened = [];
        for (var i=0; i < result.tf; i++){
          flattened.push(result.term);
        }
        return flattened;
      })
    );
  }else{
    // Return results with scores or without depending on options
    combined =  options.score ? combined : _.pluck(combined, 'term');
  }

  
  // Limit the results
  if (options.limit){
    combined = combined.slice(0, options.limit);
  }

  return combined;
};

// Text stream. Reads a text stream and emits keywords. Warning: this stream 
// behaves like a sink and will buffer all data until the source emits end.
exports.stream = function(options){
  return new exports.TextStream(options);
};

exports.TextStream = function(options){
  this.options = options;
  this.readable = true;
  this.writable = true;
  this.buffer = [];
};

util.inherits(exports.TextStream, Stream);

exports.TextStream.prototype.write = function(data){
  this.buffer.push(data);
};

exports.TextStream.prototype.end = function(data){
  var stream = this;
  if (data) this.write(data);
  exports.extract(this.buffer.join(''), this.options).forEach(function(phrase){
    stream.emit('data', phrase);
  });
  stream.emit('end');
};

// Transform stream. Reads a stream and emits keywords. If options.from is set
// it will read from the from property. If options.to is set, it will write the
// keywords to this property and return the object
exports.transformStream = function(options){
  if (!options) options = {};

  return es.through(function write(data){
    var from = options.from;
    var text = from && data.hasOwnProperty(from) ? data[from] : data;
    var keywords = exports.extract(text, options);
    if (options.to){
      data[options.to] = keywords;
      this.emit('data', data);
    }else{
      this.emit('data', keywords);
    }
  });
  
};

// Attempt to combine the results for different ngrams in order to work out
// whether we should use "national broadband network", rather than "national
// broadband" and "broadband network". In this example with a cutoff of .2,
// if the longer phrase (ngram of 3) was used 20 times, and "broadband network"
// was used 22 times (within the cutoff of 20 * 0.2), then it would be removed
// from the results. If "national broadband" was used more than the cutoff,
// e.g. 30 times, it would be left in the results.
exports.combine = function(phrases, cutoff){
  var combined = _.clone(phrases);

  _.each(_.keys(phrases), function(phrase){
    var ngramToTry, subPhrases;
    ngramToTry = phrase.split(' ').length - 1;

    if (ngramToTry < 1) return;

    _.each(natural.NGrams.ngrams(phrase, ngramToTry), function(ngram){
      var subPhrase = ngram.join(' ');
      if (phrases[subPhrase]){
        if (!cutoff || (phrases[phrase] / phrases[subPhrase]) >= (1 - cutoff)){
          delete combined[subPhrase];
        }
      }
    });
  });

  return combined;
};

var Tf = function(){
  natural.TfIdf.call(this);
};

util.inherits(Tf, natural.TfIdf);

Tf.prototype.listMostFrequestTerms = function(d) {
  var terms = [];
  for(var term in this.documents[d]) {
    terms.push({term: term, tf: natural.TfIdf.tf(term, this.documents[d])});
  }
  return terms.sort(function(x, y) { return y.tf - x.tf; });
};

function whitelisted(term, startWords){
  return startWords.indexOf(term) !== -1;
}

function blacklisted(term, extraStopWords){
  if (term.match(/^\d+$/) || term.match(/^_/)){
    return true;
  }
  return  _.indexOf(stopWords, term) !== -1 ||
    _.indexOf(extraStopWords, term) !== -1;
}

function usePhrase(phrase, options){
  return whitelisted(phrase, options.startWords) || 
    !_.detect(phrase.split(' '), function(term){
      return blacklisted(term, options.stopWords);
    });
}

