const { ADMIN_ROLE_ID } = require('../constants');
const fs = require('fs');
const Discord = require('discord.js');
const consume = require('../core/consume-command');

class Listener {
  /**
   * 
   * @param {Array<Array<string>>} matches 
   * @param {string} answer 
   */
  constructor(matches, answer) {
    this.matches = matches;
    this.answer = answer;
  }
}

/**
 * @type {Array<Listener>}
 */
let registered_listeners = new Array();

function saveListenersDatabase() {

  const content = {
    listeners: registered_listeners
  };

  fs.writeFileSync('listeners-database.json', JSON.stringify(content, null, '  '), { encoding: 'utf-8' });
}

function getListenersDatabase() {
  /**
   * @type {Array<Listener>}
   */
  registered_listeners = new Array();

  if (!fs.existsSync('listeners-database.json')) {
    return;
  }

  const content = JSON.parse(fs.readFileSync('listeners-database.json', 'utf-8'));

  registered_listeners = content.listeners;
}


exports.addListenCommands = function addListenCommand(commands) {
  getListenersDatabase();

  commands['listen'] = {
    name: 'listen',
    help: '`$listen <match-words-0>[, <match-words-n>]; <answer>`',
    command: (client, message, args) => {
      const author_member = message.guild.members.cache.get(message.author.id);
      const has_admin_role = author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
      if (!has_admin_role) {
        return consume(
          client,
          message,
          "Missing permissions",
          "You don't have the sufficient role to add a listener",
          'red'
        );
      }

      const [matches_string, ...answer] = args.join(' ').split(';');
      const matches = matches_string
        .trim()
        .split(',')
        .map(match => match.trim().split(' ').map(word => word.toLowerCase()));

      getListenersDatabase();

      const listener = new Listener(matches, answer);
      registered_listeners.push(listener);

      saveListenersDatabase();

      consume(
        client,
        message,
        "Listener added",
        `A listener was created with the following matches:\n - ${matches.map(m => `\`${m}\``).join('\n - ')}`
      );
    }
  }

  commands['listener-add-pattern'] = {
    name: 'listener-add-pattern',
    help: '`$listener-add-match <listener-id> <pattern>`',
    command: (client, message, args) => {
      const author_member = message.guild.members.cache.get(message.author.id);
      const has_admin_role = author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
      if (!has_admin_role) {
        return consume(
          client,
          message,
          "Missing permissions",
          "You don't have the sufficient role to add a pattern to a listener",
          'red'
        );
      }

      const [id, ...pattern_words] = args;

      getListenersDatabase();

      const listener = registered_listeners[id];

      if (!listener) {
        return consume (
          client,
          message,
          "No such listener",
          `Could not find a listener with the id = ${id}`,
          'red'
        );
      }

      listener.matches.push(pattern_words);

      saveListenersDatabase();

      return consume(
        client,
        message,
        "Pattern added",
        `Pattern \`${pattern_words.join(' ')}\` added to listener #${id}`
      );
    }
  }

  commands['listener-remove-pattern'] = {
    name: 'listener-remove-pattern',
    help: '`$listener-remove-match <listener-id> <pattern>`',
    command: (client, message, args) => {
      const author_member = message.guild.members.cache.get(message.author.id);
      const has_admin_role = author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
      if (!has_admin_role) {
        return consume(
          client,
          message,
          "Missing permissions",
          "You don't have the sufficient role to remove a pattern from a listener",
          'red'
        );
      }

      const [id, ...pattern_words] = args;
      /**
       * @type {string[]}
       */
      const pattern_to_remove = pattern_words.filter(c => !c.length);

      getListenersDatabase();

      const listener = registered_listeners[id];

      if (!listener) {
        return consume (
          client,
          message,
          "No such listener",
          `Could not find a listener with the id = ${id}`,
          'red'
        );
      }

      listener.matches = listener.matches
        .filter(pattern => pattern.length === pattern_to_remove.length && pattern_to_remove
          .reduce((acc, cur, i) => pattern[i] === cur && acc, false)
        );

      saveListenersDatabase();

      return consume(
        client,
        message,
        "Pattern removed",
        `Pattern \`${pattern_words.join(' ')}\` added to listener #${id}`
      );
    }
  }

  commands['get-listeners'] = {
    name: 'get-listeners',
    help: '`$get-listeners` show all the listeners and their ID',
    /**
     * @param message {Discord.Message}
     */
    command: (client, message, args) => {
      const author_member = message.guild.members.cache.get(message.author.id);
      const has_admin_role = author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
      if (!has_admin_role) {
        return consume(
          client,
          message,
          "Missing permissions",
          "You don't have the sufficient role to view the list of listeners",
          'red'
        );
      }

      registered_listeners.forEach((listener, index) => {
        message.channel.send(`**#${index}** - ${listener.matches.map(m => m.join(' ')).join(` , `)} ; ${listener.answer}`);
      });
    }
  }

  commands['remove-listener'] = {
    name: 'remove-listener',
    help: '`$remove-listener <id>` remove a listener with the supplied `id`',
    /**
     * @param {Discord.Message} message
     */
    command: (client, message, args) => {
      const author_member = message.guild.members.cache.get(message.author.id);
      const has_admin_role = author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
      if (!has_admin_role) {
        return consume(
          client,
          message,
          "Missing permissions",
          "You don't have the sufficient role to remove a listener",
          'red'
        );
      }

      if (!args.length) {
        return consume(
          client,
          message,
          "Missing parameter",
          "Please provide the id of a listener, to get its id use the `get-listeners` command",
          'red'
        );
      }

      const id = Number(args[0]);

      getListenersDatabase();
      registered_listeners = registered_listeners.filter((l, i) => i !== id);
      saveListenersDatabase();

      return consume(
        client,
        message,
        "Listener removed",
        `Listener with previous id \`${id}\` was removed`,
        'green'
      );
    }
  }
}

/**
 * 
 * @param {Discord.Message} message 
 */
exports.listenForMessage = function listenForMessage(message) {
  const content = ' ' + message.content.toLowerCase() + ' ';

  /**
   * @type {Discord.Message}
   */
  let message_before = null;

  // a way to cache the message because fetching is for every listener could
  // demande way too many requests.
  const getMessageBefore = () => {
    if (message_before === null) {
      return message.channel.messages.fetch({ before: message.id, limit: 1 })
      .then(m => {
        message_before = m;

        return m;
      });
    }
    
    return Promise.resolve(message_before);
  }

  for (const listener of registered_listeners) {
    const should_answer = listener.matches
      .filter(m => m[0] !== '^')
      .some(m => m.every(word => content.includes(word.replace(/\$/g, ' '))));


    if (should_answer) {
      const should_message_answer_bot = listener.matches[0].join('') === '^';

      if (should_message_answer_bot) {
        getMessageBefore()
        .then(before => {
          if (before.author.username === 'The Caretaker' && listener.answer.length) {
            message.channel.send(
              listener.answer
            );
          }
        });
      }
      else if (listener.answer.length) {
        message.channel.send(
          listener.answer
        );
      }
    }
  }
}