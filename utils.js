const readline = require('readline');
const stream = require('stream');
const util = require('util');

const utils = {};

utils.promise = (cb, obj = null) => {
  return new Promise((resolve, reject) => {
    cb({
      set: (key, value) => {
        if (obj === null) { obj = {}; }
        obj[key] = value;
      },
      success: () => resolve(obj),
      err: () => reject(obj)
    });
  });
};

/**
 * Prompt user for input
 * @param {String} question Question to ask before input
 * @param {(userInput): Boolean => {}} callback If returns true then prompt again
 */
utils.prompt = (question, callback) => {
  const rl = readline.createInterface(process.stdin, process.stdout);
  rl.question(question, (answer) => {
    // callback() returns true then run the prompt again
    if (callback(answer)) {
      rl.close();
      utils.prompt(question, callback);
    } else {
      rl.close();
    }
  });
};

utils.transformStreams = {

  writtenPercantage: new stream.Transform({
    transform(chunk, encoding, next) {
      console.log(this);
      this.push(chunk);
      next();
    }
  })

};

module.exports = utils;