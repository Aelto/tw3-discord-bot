"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addListenCommands = addListenCommands;
exports.listenForMessage = listenForMessage;
const listener_1 = require("./listener");
const listener_database_1 = require("./listener_database");
const prng_1 = require("../core/prng");
const { ADMIN_ROLE_ID } = require("../constants");
const fs = require("fs");
const Discord = require("discord.js");
const consume = require("../core/consume-command");
const { prompt } = require("../core/prompt.js");
let listeners_database = new listener_database_1.ListenersDatabase({});
function saveListenersDatabase() {
    fs.writeFileSync("listeners-database.json", JSON.stringify(listeners_database, null, "  "), { encoding: "utf-8" });
}
function getListenersDatabase() {
    listeners_database = new listener_database_1.ListenersDatabase({});
    if (!fs.existsSync("listeners-database.json")) {
        return;
    }
    const content = JSON.parse(fs.readFileSync("listeners-database.json", "utf-8"));
    listeners_database = listener_database_1.ListenersDatabase.fromJson(content);
}
function addListenCommands(commands) {
    getListenersDatabase();
    commands["listen"] = {
        name: "listen",
        help: "`$listen` and answer the questions.",
        command: async (client, message, args) => {
            const author_member = message.guild.members.cache.get(message.author.id);
            const has_admin_role = author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
            if (!has_admin_role) {
                return consume(client, message, "Missing permissions", "You don't have the sufficient role to add a listener", "red");
            }
            let listener_object = {
                answers: [],
                matches: [],
                probability: 1,
                only_direct_conversation: false,
            };
            if (args.length) {
                try {
                    listener_object = JSON.parse(args.join(" "));
                }
                catch (err) {
                    return consume(client, message, "Incorrect parameters", `The JSON object you passed appears to be incorrect:\n\`\`\`${err}\`\`\``, "red");
                }
            }
            else {
                try {
                    // adding answers:
                    while (true) {
                        const answer = await prompt(client, message, `Please provide an answer for the listener. You have 300 seconds to answer`, 300, true);
                        listener_object.answers.push(answer.content);
                        const yes_or_no = await prompt(client, message, `Do you wish to continue adding answers? (Yes/No)`, 60, true);
                        if (!yes_or_no.content.toLowerCase().startsWith("y")) {
                            break;
                        }
                    }
                    // adding matches:
                    while (true) {
                        const answer = await prompt(client, message, `Please provide a match for the listener. You have 300 seconds to answer. Examples:\n` +
                            "`rer bible` or even a regex `/rer.*bible/`", 300, true);
                        listener_object.matches.push(answer.content);
                        const yes_or_no = await prompt(client, message, `Do you wish to continue adding matches? (Yes/No)`, 60, true);
                        if (!yes_or_no.content.toLowerCase().startsWith("y")) {
                            break;
                        }
                    }
                    // probability:
                    {
                        const answer = await prompt(client, message, `What do you wish the probability to be. You have 300 seconds to answer.\n` +
                            `It must be a number between 0 and 1 where 0 is 0% and 1 is 100%`, 300, true);
                        listener_object.probability = Number(answer.content);
                    }
                    // only direct conversation
                    {
                        const answer = await prompt(client, message, `Do you wish the listener to trigger only in direct conversations with the bot? You have 60 seconds to answer (Yes/No)`, 60, true);
                        listener_object.only_direct_conversation = answer.content
                            .toLowerCase()
                            .startsWith("y");
                    }
                }
                catch (err) {
                    consume(client, message, "Timeout", `Your request was cancelled`);
                }
            }
            getListenersDatabase();
            const listener = listener_1.Listener.fromJson(listener_object);
            listeners_database.push(listener);
            saveListenersDatabase();
            consume(client, message, "Listener added", `A listener was created with the following matches:\n - ${listener_object.matches
                .map((m) => `\`${m}\``)
                .join("\n - ")}`);
        },
    };
    commands["remove-listener"] = {
        name: "remove-listener",
        help: "`$remove-listener <id>` remove a listener with the supplied `id`",
        /**
         * @param {Discord.Message} message
         */
        command: (client, message, args) => {
            const author_member = message.guild.members.cache.get(message.author.id);
            const has_admin_role = author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
            if (!has_admin_role) {
                return consume(client, message, "Missing permissions", "You don't have the sufficient role to remove a listener", "red");
            }
            if (!args.length) {
                return consume(client, message, "Missing parameter", "Please provide the id of a listener, to get its id use the `find-listeners` command", "red");
            }
            const id = Number(args[0]);
            getListenersDatabase();
            listeners_database.remove(id);
            saveListenersDatabase();
            return consume(client, message, "Listener removed", `Listener with previous id \`${id}\` was removed`, "green");
        },
    };
    commands["find-listener"] = {
        name: "find-listener",
        help: "`$find-listener <message that should trigger a listener>` to get a list of listeners that have reacted to the message",
        /**
         *
         * @param {Discord.Client} client
         * @param {Discord.Message} message
         * @param {string[]} args
         */
        command: (client, message, args) => {
            const listeners = new Set(listeners_database.getListenersThatMatch(args.join(" ")));
            const filtered_listeners = listeners_database.listeners
                .map((listener, index) => ({ listener, index }))
                .filter(({ listener }) => listeners.has(listener));
            if (filtered_listeners.length > 0) {
                message.channel
                    .send(filtered_listeners
                    .map(({ listener, index }) => `**#${index}**:\n\`\`\`${JSON.stringify(listener, null, " ")}\`\`\``)
                    .join("\n"), {
                    split: true,
                })
                    .catch(console.error);
            }
        },
    };
}
async function listenForMessage(message) {
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
    const found_listeners = listeners_database.getListenersThatMatch(message.content);
    for (const listener of found_listeners) {
        const should_message_answer_bot = listener.only_direct_conversation;
        const probability = listener.probability || 1;
        if (!prng_1.prng.nextProc(probability)) {
            continue;
        }
        if (should_message_answer_bot) {
            getMessageBefore().then(async (before) => {
                if (!before) {
                    return;
                }
                if (before.author.username === "The Caretaker" &&
                    listener.answers.canSend()) {
                    await listener.answers.sendReplies(message);
                }
            });
        }
        else if (listener.answers.canSend()) {
            await listener.answers.sendReplies(message);
        }
    }
}
