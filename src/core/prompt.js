const consume = require('./consume-command');

/**
 * if set to a value, the next message received from `author`
 * in the specific `channel` will be used to resolve `waiting_promise`
 */
let waiting_answer_from = {
  channel: null,
  author: null,
  waiting_promise_resolver: null,
};

exports.prompt_handler = function prompt_handler(message, client) {
  /**
   * 1. look if the message is the answer of a previously
   *    asked question
   */
  if (
    waiting_answer_from.author !== null &&
    waiting_answer_from.channel !== null
  ) {
    const { author, channel } = waiting_answer_from;

    if (message.author === author && message.channel.id === channel.id) {
      return waiting_answer_from.waiting_promise_resolver(message);
    }
  }
};

exports.prompt = function prompt(
  client,
  message,
  question,
  delay = 60,
  keep_original_message = false
) {
  return new Promise((resolve, reject) => {
    waiting_answer_from.channel = message.channel;
    waiting_answer_from.author = message.author;

    waiting_answer_from.waiting_promise_resolver = (v) => {
      remove_waiting_answer();

      return resolve(v);
    };

    consume(
      client,
      message,
      `Please answer in less than ${delay}s`,
      question,
      'blue',
      keep_original_message
    );

    setTimeout(() => {
      remove_waiting_answer();

      reject('timeout');
    }, delay * 1000);
  });
};

function remove_waiting_answer() {
  waiting_answer_from.channel = null;
  waiting_answer_from.author = null;
  waiting_answer_from.waiting_promise_resolver = null;
}
exports.remove_waiting_answer = remove_waiting_answer;
