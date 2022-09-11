const { ADMIN_ROLE_ID } = require('../constants');
const fs = require('fs');
const Discord = require('discord.js');
const consume = require('../core/consume-command');
const { prompt } = require('../core/prompt.js');

class ListenersDatabase {
  constructor({ listeners = [] }) {
    this.listeners = listeners;
  }

  push(listener) {
    this.listeners.push(listener);
  }

  remove(index) {
    this.listeners = this.listeners.filter((l, i) => i != index);
  }

  getListenersThatMatch(message) {
    let formatted_message = message.toLowerCase();

    return this.listeners.filter((listener) =>
      listener.doesMatch(formatted_message)
    );
  }

  getAnswersForMessage(message) {
    const listeners = this.getListenersThatMatch(message);

    return listeners.flatMap((listener) => listener.answers);
  }
}

class Listener {
  constructor({
    matches = [],
    probability = 1,
    answers = [],
    only_direct_conversation = false,
  }) {
    this.matches = matches;
    this.probability = probability;
    this.only_direct_conversation = only_direct_conversation;
    this.answers = answers;
  }

  /**
   * returns whether the given messages matches with this listener.
   * @param {String} message
   */
  doesMatch(message) {
    return this.matches.some((match) => match.matches(message));
  }
}

class Match {
  constructor(match_string) {
    this.match_string = match_string.toLowerCase();

    if (match_string.startsWith('/') && match_string.endsWith('/')) {
      this.cached_regex = new RegExp(match_string.slice(1, -1));
    } else {
      this.cached_words = this.match_string
        .split(' ')
        .map((word) => word.replace(/\$/, ' '));
    }
  }

  matches(message) {
    if (this.cached_regex) {
      return this.cached_regex.test(message);
    } else {
      return this.cached_words.every((word) => message.includes(word));
    }
  }

  toJSON() {
    return this.match_string;
  }
}

let listeners_database = new ListenersDatabase({});

function saveListenersDatabase() {
  fs.writeFileSync(
    'listeners-database.json',
    JSON.stringify(listeners_database, null, '  '),
    { encoding: 'utf-8' }
  );
}

function getListenersDatabase() {
  /**
   * @type {Array<Listener>}
   */
  listeners_database = new Array();

  if (!fs.existsSync('listeners-database.json')) {
    return;
  }

  const content = JSON.parse(
    fs.readFileSync('listeners-database.json', 'utf-8')
  );

  listeners_database = new ListenersDatabase({
    listeners: content.listeners.map(
      (listener) =>
        new Listener({
          ...listener,
          matches: listener.matches.map((match) => new Match(match)),
        })
    ),
  });
}

exports.addListenCommands = function addListenCommand(commands) {
  getListenersDatabase();

  commands['listen'] = {
    name: 'listen',
    help: [
      '`$listen { matches: [<match_1>, <match_2>, ..., <match_n>], probability: 1, answers: ["Answer one", "Answer two", ...], only_direct_conversation: false }`',
      '\n  - Where a match can either be a regex `/my(regex)?/` or a series of word that must all be found in the message and where `$`',
      'can be used to express a space: `["rer$bible", "/my(regex)?(example)+/"`, "all of these words must be found but in any order"]',
      '\n  - Where `probability` can be any number between 0 and 1, where 0 means 0% chance and 1 means 100% chance for the listener to trigger in case of a successful match',
      '\n  - Where `answers` is a list of all the messages that will be sent if the listener matches',
      "\n  - Where `only_direct_conversation` is a boolean that once set to true indicates the listener should match only if the message follows one of the bot's message",
    ].join(''),
    command: async (client, message, args) => {
      const author_member = message.guild.members.cache.get(message.author.id);
      const has_admin_role =
        author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
      if (!has_admin_role) {
        return consume(
          client,
          message,
          'Missing permissions',
          "You don't have the sufficient role to add a listener",
          'red'
        );
      }

      let listener_object = {
        answers: [],
        matches: [],
        probability: 1,
        only_direct_conversation: false,
      };

      if (args.length) {
        try {
          listener_object = JSON.parse(args.join(' '));
        } catch (err) {
          return consume(
            client,
            message,
            'Incorrect parameters',
            'The JSON object you passed appears to be incorrect',
            'red'
          );
        }
      } else {
        try {
          // adding answers:
          while (true) {
            const answer = await prompt(
              client,
              message,
              `Please provide an answer for the listener. You have 300 seconds to answer`,
              300,
              true
            );

            listener_object.answers.push(answer.content);

            const yes_or_no = await prompt(
              client,
              message,
              `Do you wish to continue adding answers? (Yes/No)`,
              60,
              true
            );

            if (!yes_or_no.content.toLowerCase().startsWith('y')) {
              break;
            }
          }

          // adding matches:
          while (true) {
            const answer = await prompt(
              client,
              message,
              `Please provide a match for the listener. You have 300 seconds to answer. Examples:\n` +
                '`rer bible` or even a regex `/rer.*bible/`',
              300,
              true
            );

            listener_object.matches.push(answer.content);

            const yes_or_no = await prompt(
              client,
              message,
              `Do you wish to continue adding matches? (Yes/No)`,
              60,
              true
            );

            if (!yes_or_no.content.toLowerCase().startsWith('y')) {
              break;
            }
          }

          // probability:
          {
            const answer = await prompt(
              client,
              message,
              `What do you wish the probability to be. You have 300 seconds to answer.\n` +
                `It must be a number between 0 and 1 where 0 is 0% and 1 is 100%`,
              300,
              true
            );

            listener_object.probability = Number(answer.content);
          }

          // only direct conversation
          {
            const answer = await prompt(
              client,
              message,
              `Do you wish the listener to trigger only in direct conversations with the bot? You have 60 seconds to answer (Yes/No)`,
              60,
              true
            );

            listener_object.only_direct_conversation = answer.content
              .toLowerCase()
              .startsWith('y');
          }
        } catch (err) {
          consume(client, message, 'Timeout', `Your request was cancelled`);
        }
      }

      getListenersDatabase();

      const listener = new Listener({
        ...listener_object,
        matches: listener_object.matches.map((m) => new Match(m)),
      });

      listeners_database.push(listener);

      saveListenersDatabase();

      consume(
        client,
        message,
        'Listener added',
        `A listener was created with the following matches:\n - ${listener_object.matches
          .map((m) => `\`${m}\``)
          .join('\n - ')}`
      );
    },
  };

  commands['remove-listener'] = {
    name: 'remove-listener',
    help: '`$remove-listener <id>` remove a listener with the supplied `id`',
    /**
     * @param {Discord.Message} message
     */
    command: (client, message, args) => {
      const author_member = message.guild.members.cache.get(message.author.id);
      const has_admin_role =
        author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
      if (!has_admin_role) {
        return consume(
          client,
          message,
          'Missing permissions',
          "You don't have the sufficient role to remove a listener",
          'red'
        );
      }

      if (!args.length) {
        return consume(
          client,
          message,
          'Missing parameter',
          'Please provide the id of a listener, to get its id use the `find-listeners` command',
          'red'
        );
      }

      const id = Number(args[0]);

      getListenersDatabase();
      listeners_database.remove(id);
      saveListenersDatabase();

      return consume(
        client,
        message,
        'Listener removed',
        `Listener with previous id \`${id}\` was removed`,
        'green'
      );
    },
  };

  commands['find-listener'] = {
    name: 'find-listener',
    help: '`$find-listener <message that should trigger a listener>` to get a list of listeners that have reacted to the message',
    /**
     *
     * @param {Discord.Client} client
     * @param {Discord.Message} message
     * @param {string[]} args
     */
    command: (client, message, args) => {
      const listeners = new Set(
        listeners_database.getListenersThatMatch(message.content)
      );

      const filtered_listeers = listeners_database.listeners
        .map((listener, index) => ({ listener, index }))
        .filter(({ listener }) => listeners.has(listener));

      message.channel
        .send(
          filtered_listeers
            .map(
              ({ listener, index }) =>
                `**#${index}**:\n\`\`\`${JSON.stringify(
                  listener,
                  null,
                  ' '
                )}\`\`\``
            )
            .join('\n'),
          {
            split: true,
          }
        )
        .catch(console.error);
    },
  };
};

/**
 *
 * @param {Discord.Message} message
 */
exports.listenForMessage = async function listenForMessage(message) {
  /**
   * @type {Discord.Message}
   */
  let message_before = null;

  // a way to cache the message because fetching for every listener could
  // demand way too many requests.
  const getMessageBefore = () => {
    if (message_before === null) {
      return message.channel.messages
        .fetch({ before: message.id, limit: 1 })
        .then((m) => {
          message_before = m.first();

          return message_before;
        });
    }

    return Promise.resolve(message_before);
  };

  for (const listener of listeners_database.getListenersThatMatch(
    message.content
  )) {
    const should_message_answer_bot = listener.only_direct_conversation;

    if (should_message_answer_bot) {
      getMessageBefore().then((before) => {
        if (
          before.author.username === 'The Caretaker' &&
          listener.answer.length
        ) {
          message.channel.send(listener.answers).catch(console.error);
        }
      });
    } else if (listener.answers.length) {
      const row = new Discord.MessageActionRow().addComponents(
        new Discord.MessageButton()
          .setCustomId('delete_listen')
          .setLabel('Delete')
          .setStyle('SECONDARY')
      );

      for (const answer of listener.answers) {
        await message
          .reply({
            content: answer,
            components: [row],
          })
          .catch(console.error);
      }
    }
  }
};
