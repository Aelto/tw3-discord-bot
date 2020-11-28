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
  const listeners = Array.from(registered_listeners.entries());

  const content = {
    listeners
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
        .split(',')
        .map(match => match.split(' '));

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
        message.channel.send(`**#${index}** - ${listener.matches.join(` , `)} ; ${listener.answer}`);
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

      const [id] = args;

      if (!id) {
        return consume(
          client,
          message,
          "Missing parameter",
          "Please provide the id of a listener, to get its id use the `get-listeners` command",
          'red'
        );
      }

      getListenersDatabase();
      registered_listeners = registered_listeners.filter((l, i) => i !== id);
      saveListenersDatabase();
    }
  }
}

/**
 * 
 * @param {Discord.Message} message 
 */
exports.listenForMessage = function listenForMessage(message) {
  for (const listener of registered_listeners) {
    const should_answer = listener.matches
      .some(m => m.every(word => message.content.includes(word)));

    if (should_answer) {
      message.channel.send(
        listener.answer
      );
    }
  }
}