import { Client, Message, MessageAttachment } from "discord.js";
import { activeUserInteractionHandler } from "./antibot_handler/active_users";
import { addListenCommands, listenForMessage } from "./commands/listen";

const Discord = require("discord.js");
const fs = require("fs");
const {
  ADMIN_ROLE_ID,
  WARNED_ROLE_1_ID,
  WARNED_ROLE_2_ID,
  MAIN_CHANNEL_ID,
  COMMANDS_PREFIX,
  LOG_CHANNEL_ID,
} = require("./constants.js");
const key = require("./key");

const consume = require("./core/consume-command.js");

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});
const addScreenshotReactionListener = require("./screenshot_handler.js");
const {
  antibot_handler,
  antibot_interaction_handler,
} = require("./antibot_handler");
const thread_channel_handler = require("./thread_channel_handler.js");
const helpme_channel_handler = require("./helpme_handler");
client.login(key);

const {
  prompt,
  prompt_handler,
  remove_waiting_answer,
} = require("./core/prompt.js");

function getUserFromMention(mention) {
  if (!mention) return;

  if (mention.startsWith("<@") && mention.endsWith(">")) {
    mention = mention.slice(2, -1);

    if (mention.startsWith("!")) {
      mention = mention.slice(1);
    }

    return client.users.cache.get(mention);
  }
}

const commands = {};

commands["help"] = {
  name: "help",
  help: "`$help`: show help message",
  command: (client, message) => {
    const helpMessage = Object.keys(commands).reduce((acc, name) => {
      const command = commands[name];
      acc += `- **${command.name}** ${command.help}\n`;

      return acc;
    }, "");

    consume(
      client,
      message,
      "Here is a list of the commands and what they do",
      helpMessage,
      "blue"
    );
  },
};

commands["report"] = {
  name: "report",
  help: "`$report @user [reason]` to report a user and optionally give the reason for the report",
  command: async (client, message, args) => {
    const delay = 60;

    const author_member = message.guild.members.cache.get(message.author.id);
    const has_admin_role =
      author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
    if (!has_admin_role) {
      return consume(
        client,
        message,
        "Missing permissions",
        "You don't have the sufficient role to report someone",
        "red"
      );
    }

    let reported_user = null;
    const [at_ping, ...reason_words] = args;
    if (!at_ping) {
      const who_answer = await prompt(
        client,
        message,
        `Looks like you forgot who to report, who do you want to report. @ him please.`,
        delay,
        true
      );

      reported_user = getUserFromMention(who_answer.content);
    } else {
      reported_user = getUserFromMention(at_ping);
    }

    const reported_member = message.guild.members.cache.get(reported_user.id);

    let report_confirmed = false;
    let level = 0;
    try {
      let confirm;

      if (
        !reported_member.roles.cache.has(WARNED_ROLE_1_ID) &&
        !reported_member.roles.cache.has(WARNED_ROLE_2_ID)
      ) {
        confirm = await prompt(
          client,
          message,
          `Do you confirm you want to report ${reported_user.username}, this will be his 1st offense`,
          delay
        );

        level = 1;
      } else if (reported_member.roles.cache.has(WARNED_ROLE_1_ID)) {
        confirm = await prompt(
          client,
          message,
          `Do you confirm you want to report ${reported_user.username}, this will be his 2nd offense`,
          delay
        );

        level = 2;
      } else if (reported_member.roles.cache.has(WARNED_ROLE_2_ID)) {
        confirm = await prompt(
          client,
          message,
          `Do you confirm you want to report ${reported_user.username}, this will be his 3nd and last offense`,
          delay
        );

        level = 3;
      }

      report_confirmed = confirm.content.toLowerCase().includes("yes");
    } catch (err) {}

    if (report_confirmed) {
      const reason = reason_words.join(" ").trim() || "_No reason given_";

      Promise.resolve()
        .then(() => {
          if (level === 1) {
            reported_member.roles.add(WARNED_ROLE_1_ID);

            const embed = new Discord.MessageEmbed()
              .setAuthor({
                name: client.user.username,
                icon_url: client.user.avatarURL,
              })
              .setTitle("Reported user")
              .setDescription(
                String(
                  `<@${reported_user.id}> has been reported by the peacekeepers and is now **warned**. The third report results in an automatic kick from the server\n\n**__The reason for the report is:__**\n${reason}`
                )
              )
              .setColor(15158332)
              .setTimestamp(new Date())
              .setFooter({
                icon_url: reported_user.avatarURL,
                text: reported_user.username,
              });
            return message.guild.channels.cache
              .get(MAIN_CHANNEL_ID)
              .send({ embeds: [embed] })
              .catch(console.error);
          } else if (level === 2) {
            reported_member.roles.remove(WARNED_ROLE_1_ID);
            reported_member.roles.add(WARNED_ROLE_2_ID);

            const embed = new Discord.MessageEmbed()
              .setAuthor({
                name: client.user.username,
                icon_url: client.user.avatarURL,
              })
              .setTitle("Reported user")
              .setDescription(
                String(
                  `<@${reported_user.id}> has been reported by the peacekeepers and is now **flagged**, the 2nd strike. The third report results in an automatic kick from the server\n\n**__The reason for the report is:__**\n${reason}`
                )
              )
              .setColor(15158332)
              .setTimestamp(new Date())
              .setFooter({
                icon_url: reported_user.avatarURL,
                text: reported_user.username,
              });

            return message.guild.channels.cache
              .get(MAIN_CHANNEL_ID)
              .send({ embeds: [embed] })
              .catch(console.error);
          } else {
            reported_member.kick(
              `You were kicked from the server due to repeated offenses. Reason for the last report: ${reason}`
            );

            const embed = new Discord.MessageEmbed()
              .setAuthor({
                name: client.user.username,
                icon_url: client.user.avatarURL,
              })
              .setTitle("Reported user")
              .setDescription(
                String(
                  `<@${reported_user.id}> has been reported by the peacekeepers and is now **kicked**.\n\n**__The reason for the report is:__**\n${reason}`
                )
              )
              .setColor(15158332)
              .setTimestamp(new Date())
              .setFooter({
                icon_url: reported_user.avatarURL,
                text: reported_user.username,
              });

            return message.guild.channels.cache
              .get(MAIN_CHANNEL_ID)
              .send({ embeds: [embed] })
              .catch(console.error);
          }
        })
        .then(() => {
          remove_waiting_answer();
        });
    } else {
      message.channel
        .send([`Reports towards ${reported_user} were cancelled`])
        .then(() => {
          remove_waiting_answer();
        })
        .catch(console.error);
    }
  },
};

commands["cleanse"] = {
  name: "cleanse",
  help: "`$cleanse @user` to cleanse a user of the **last** warned role he got from the `report` command. ",
  command: async (client, message, args) => {
    const delay = 60;

    const author_member = message.guild.members.cache.get(message.author.id);
    const has_admin_role =
      author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
    if (!has_admin_role) {
      return consume(
        client,
        message,
        "Missing permissions",
        "You don't have the sufficient role to cleanse someone",
        "red"
      );
    }

    let cleansed_user = null;
    if (!args[0]) {
      const who_answer = await prompt(
        client,
        message,
        `Looks like you forgot who to cleanse, who do you want to cleanse. @ him please.`,
        delay,
        true
      );

      cleansed_user = getUserFromMention(who_answer.content);
    } else {
      cleansed_user = getUserFromMention(args[0]);
    }

    const cleansed_member = message.guild.members.cache.get(cleansed_user.id);

    let cleanse_confirmed = false;
    let level = 0;
    try {
      let confirm;

      if (cleansed_member.roles.cache.has(WARNED_ROLE_1_ID)) {
        confirm = await prompt(
          client,
          message,
          `Do you confirm you want to cleanse ${cleansed_user.username}, he is currently at his 1st offense and will be cleansed of all negative roles`,
          delay
        );

        level = 1;
      } else if (cleansed_member.roles.cache.has(WARNED_ROLE_2_ID)) {
        confirm = await prompt(
          client,
          message,
          `Do you confirm you want to cleanse ${cleansed_user.username}, he is currently at his 2nd offense and will be downgraded to the 1st offense`,
          delay
        );

        level = 2;
      }

      cleanse_confirmed = confirm.content.toLowerCase().includes("yes");
    } catch (err) {}

    if (cleanse_confirmed) {
      message.channel
        .send([`${cleansed_user} was cleansed`])
        .catch(console.error)
        .then(() => {
          if (level === 1) {
            cleansed_member.roles.remove(WARNED_ROLE_1_ID);

            const embed = new Discord.MessageEmbed()
              .setAuthor({
                name: client.user.username,
                icon_url: client.user.avatarURL,
              })
              .setTitle("Cleansed user")
              .setDescription(
                String(
                  `<@${cleansed_user.id}> was cleansed by the peacekeepers and is now free of all the negative roles`
                )
              )
              .setColor(3066993)
              .setTimestamp(new Date())
              .setFooter({
                icon_url: cleansed_member.avatarURL,
                text: cleansed_member.username,
              });
            return message.guild.channels.cache
              .get(MAIN_CHANNEL_ID)
              .send({ embeds: [embed] });
          } else if (level === 2) {
            cleansed_member.roles.add(WARNED_ROLE_1_ID);
            cleansed_member.roles.remove(WARNED_ROLE_2_ID);

            const embed = new Discord.MessageEmbed()
              .setAuthor({
                name: client.user.username,
                icon_url: client.user.avatarURL,
              })
              .setTitle("Cleansed user")
              .setDescription(
                String(
                  `<@${cleansed_user.id}> was cleansed by the peacekeepers and is now back to the **warned** role.`
                )
              )
              .setColor(3066993)
              .setTimestamp(new Date())
              .setFooter({
                icon_url: cleansed_member.avatarURL,
                text: cleansed_member.username,
              });
            return message.guild.channels.cache
              .get(MAIN_CHANNEL_ID)
              .send({ embeds: [embed] })
              .catch(console.error);
          }
        })
        .then(() => {
          remove_waiting_answer();
        });
    } else {
      message.channel
        .send([`Cleanse towards ${cleansed_user} were cancelled`])
        .catch(console.error)
        .then(() => {
          remove_waiting_answer();
        });
    }
  },
};

class Mod {
  name: string;
  link: string;
  description: string;
  constructor(name, link, description) {
    this.name = name;
    this.link = link;
    this.description = description || "";
  }
}

/**
 * @type {Map<string, Mod>}
 */
let registered_mods = new Map();

/**
 * @type {Map<string, Mod>}
 */
let mod_requests = new Map();

getModDatabase();

function saveModDatabase() {
  const mods = Array.from(registered_mods.entries());
  const requests = Array.from(mod_requests.entries());

  const content = {
    mods,
    requests,
  };

  fs.writeFileSync("mods-database.json", JSON.stringify(content, null, "  "), {
    encoding: "utf-8",
  });
}

function getModDatabase() {
  registered_mods.clear();
  mod_requests.clear();

  if (!fs.existsSync("mods-database.json")) {
    return;
  }

  const content = JSON.parse(fs.readFileSync("mods-database.json", "utf-8"));

  registered_mods = new Map(content.mods);
  mod_requests = new Map(content.requests);
}

commands["modregister"] = {
  name: "modregister",
  help: "`$modregister <name> <link> [description]` to register a new mod",
  command: (client, message, args) => {
    if (args.length < 2) {
      return consume(
        client,
        message,
        "Cannot register your mod",
        `<@${message.author.id}>, to register a mod you must give a name, a link and optionally a description for the mod.`,
        "red"
      );
    }

    const [name, link, ...description] = args;

    mod_requests.set(args[0], new Mod(name, link, description.join(" ")));
    saveModDatabase();

    consume(
      client,
      message,
      "Thanks for registering a new mod",
      `<@${message.author.id}> has registered the mod ${args[0]}. It will be added to the database after a Peacekeeper has validater the request`,
      "blue"
    );
  },
};

commands["modrequests"] = {
  name: "modrequests",
  help: "`$modrequests [id] [yes/no]` to get the pending requests & to accept/deny a specific request",
  command: (client, message, args) => {
    const author_member = message.guild.members.cache.get(message.author.id);
    const has_admin_role =
      author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
    if (!has_admin_role) {
      return consume(
        client,
        message,
        "Missing permissions",
        "You don't have the sufficient role to view the pending requests",
        "red"
      );
    }

    if (!args.length) {
      const pending_requests = Array.from(mod_requests.entries()).map(
        ([name, { link }]) => `**${name}**: ${link}`
      );

      if (!pending_requests.length) {
        return consume(
          client,
          message,
          "No pending requests left",
          "No pending requests left",
          "red"
        );
      }

      consume(
        client,
        message,
        "Here is a list of all the pending requests i have",
        pending_requests.join("\n") || "",
        "green"
      );
    } else if (args.length == 1) {
      const pending_request = mod_requests.get(args[0]);

      consume(
        client,
        message,
        "Here is the information i have on the pending request",
        [
          `**name**: ${pending_request.name}`,
          `**link**: ${pending_request.link}`,
          `**description**: ${pending_request.description}`,
        ].join("\n"),
        "green"
      );
    } else {
      const pending_request = mod_requests.get(args[0]);
      const is_accepted = String(args[1]).toLowerCase() === "yes";

      if (!mod_requests.has(args[0])) {
        return consume(
          client,
          message,
          "Cannot accept pending request",
          `There is no pending request for ${args[0]}`,
          "red"
        );
      }

      mod_requests.delete(args[0]);
      saveModDatabase();

      if (is_accepted) {
        registered_mods.set(args[0], pending_request);
        saveModDatabase();

        return consume(
          client,
          message,
          "Pending request accepted",
          `The mod **${args[0]}** was accepted and has been added to the database`,
          "green"
        );
      }

      consume(
        client,
        message,
        "Pending request denied",
        `The mod **${args[0]}** was denied and has been removed from the requests`,
        "red"
      );
    }
  },
};

commands["mods"] = {
  name: "mods",
  help: "`$mods [name <name-search>] [search <keywords-search>]` to get the list of all mods, or retrieve one mod by its name or search among all mods description",
  command: (client, message, args) => {
    const [arg, ...search] = args;

    if (arg === "name") {
      if (!registered_mods.has(search.join(" ").trim())) {
        return consume(
          client,
          message,
          "No mod found",
          `There is no mod with the name ${search}`,
          "red"
        );
      }

      const mod = registered_mods.get(search.join(" ").trim());
      const mod_information = [
        `**__${mod.name}__** - ${mod.link}`,
        mod.description,
      ].join("\n");

      consume(
        client,
        message,
        "Here is the information i have about the mod",
        mod_information,
        "green"
      );
    } else if (arg === "search") {
      const mods = Array.from(registered_mods).filter(
        ([name, { link, description }]) =>
          search.some((s) => name.includes(s) || description.includes(s))
      );

      consume(
        client,
        message,
        "Here is the information i have about the mod. (descriptions removed)",
        mods.map(([_, mod]) => `**__${mod.name}__** - ${mod.link}`).join("\n"),
        "green"
      );
    } else {
      const mods = Array.from(registered_mods);

      if (!mods.length) {
        return consume(
          client,
          message,
          "Here is a list of all the mods i know. (descriptions removed)",
          "No registered mod yet, use the `$modregister` command to add one",
          "red"
        );
      }

      consume(
        client,
        message,
        "Here is a list of all the mods i know. (descriptions removed)",
        mods.map(([_, mod]) => `**__${mod.name}__** - ${mod.link}`).join("\n"),
        "green"
      );
    }
  },
};

commands["modremove"] = {
  name: "modremove",
  help: "`$modremove <name>` to remove a mod from the database",
  command: (client, message, args) => {
    const author_member = message.guild.members.cache.get(message.author.id);
    const has_admin_role =
      author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
    if (!has_admin_role) {
      return consume(
        client,
        message,
        "Missing permissions",
        "You don't have the sufficient role to remove a mod",
        "red"
      );
    }

    const [name] = args;

    if (!registered_mods.has(name)) {
      return consume(
        client,
        message,
        "No mod found",
        `No mod found with the name ${name}`,
        "red"
      );
    }

    registered_mods.delete(name);

    saveModDatabase();

    return consume(
      client,
      message,
      "Mod removed",
      `the mod **${name}** was removed from the database`,
      "green"
    );
  },
};

commands["say"] = {
  name: "say",
  help: "`$say <channel-id> <message>`",
  /**
   *
   * @param {Discord.Client} client
   * @param {Discord.Message} message
   * @param {string[]} args
   * @returns
   */
  command: async (client, message, args) => {
    if (args.length < 2) {
      return consume(
        client,
        message,
        "Invalid arguments",
        `you must provide a channel id and a message`,
        "red"
      );
    }

    const [channel_id, ...words] = args;

    try {
      const channel = await client.channels.fetch(channel_id);
      const text = words.join(" ");

      message.delete();
      channel.send(text).catch(console.error);
    } catch (err) {
      consume(
        client,
        message,
        "Unknown channel",
        `no channel exists with the id ${channel_id}`,
        "red"
      );
    }
  },
};

commands["announce"] = {
  name: "announce",
  help: "`$announce <channel-id> <message>`",
  /**
   *
   * @param {Discord.Client} client
   * @param {Discord.Message} message
   * @param {string[]} args
   * @returns
   */
  command: async (client, message, args) => {
    if (args.length < 2) {
      return consume(
        client,
        message,
        "Invalid arguments",
        `you must provide a channel id and a message`,
        "red"
      );
    }

    const [channel_id, ...words] = args;

    try {
      const channel = await client.channels.fetch(channel_id);
      const text = words.join(" ");
      const embed = new Discord.MessageEmbed()
        .setTitle("Message from the peacekeepers")
        .setDescription(String(text))
        .setColor(0)
        .setTimestamp(new Date());

      message.delete();
      channel.send({ embeds: [embed] }).catch(console.error);
    } catch (err) {
      consume(
        client,
        message,
        "Unknown channel",
        `no channel exists with the id ${channel_id}`,
        "red"
      );
    }
  },
};

commands["poll"] = {
  name: "poll",
  help: `tells the bot to write the lines in the given channel so people can react to each individual line`,
  /**
   *
   * @param {Discord.Client} client
   * @param {Discord.Message} message
   * @param {string[]} args
   * @returns
   */
  command: async (client, message, args) => {
    if (args.length < 2) {
      return consume(
        client,
        message,
        "Invalid arguments",
        `you must provide a channel id and a message`,
        "red"
      );
    }

    const [channel_id, ...words] = args;

    try {
      const channel = await client.channels.fetch(channel_id);
      const lines = words.join(" ").split("\n");

      for (const line of lines) {
        if (line.trim().length <= 0) {
          continue;
        }

        channel.send(line).catch(console.error);

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      message.delete();
    } catch (err) {
      consume(
        client,
        message,
        "Unknown channel",
        `no channel exists with the id ${channel_id}`,
        "red"
      );
    }
  },
};

commands["order66"] = {
  name: "order66",
  help: [
    "`$order66 <channel-id> <start-message-id> [<end-message-id>]`, to delete,",
    " in the given channel, the messages starting from `start-message-id`",
    " until the end message or the end of the channel. **Important**: The first",
    " message is not deleted, it is not included in the range",
  ].join(""),
  /**
   *
   * @param {Discord.Client} client
   * @param {Discord.Message} message
   * @param {string[]} args
   * @returns
   */
  command: async (client, message, args) => {
    const author_member = message.guild.members.cache.get(message.author.id);
    const has_admin_role =
      author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
    if (!has_admin_role) {
      return consume(
        client,
        message,
        "Missing permissions",
        "You don't have the sufficient role to remove a mod",
        "red"
      );
    }

    const [channel_id, start_message_id, end_message_id] = args;

    if (!start_message_id) {
      return consume(
        client,
        message,
        "Missing parameter",
        "You must pass as a second parameter the ID of the starting point for the deletion",
        "red"
      );
    }

    const channel =
      channel_id.trim().toLowerCase() === "here"
        ? message.channel
        : await client.channels
            .fetch(channel_id)
            .catch(() =>
              consume(
                client,
                message,
                "Unknown channel",
                `no channel exists with the id ${channel_id}`,
                "red"
              )
            );

    const gif_message = await channel
      .send(
        "https://tenor.com/view/execute-order66-order66-66-palpatine-star-wars-gif-20468321"
      )
      .catch((e) =>
        consume(
          client,
          message,
          "Error while sending a funny gif message",
          e,
          "red"
        )
      );

    const end_message_param = Boolean(end_message_id)
      ? { before: end_message_id }
      : {};

    const messages = await channel.messages
      .fetch({
        after: start_message_id,
        cache: false,
        ...end_message_param,
      })
      .catch((e) =>
        consume(client, message, "Error while fetching the messages", e, "red")
      );

    if (end_message_id) {
      messages.sweep((message) => message.id > end_message_id);
    }

    // wait 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000));

    channel.bulkDelete(messages).catch((e) => {
      console.log(e);
      consume(client, message, "Error while deleting the messages", e, "red");
    });

    if (end_message_id) {
      gif_message
        .delete()
        .catch((e) =>
          consume(
            client,
            message,
            "Error while deleting the gif message",
            e,
            "red"
          )
        );

      await message
        .delete()
        .catch((e) =>
          consume(
            client,
            message,
            "Error while deleting the command message",
            e,
            "red"
          )
        );
    }
  },
};

commands["test"] = {
  name: "test",
  help: "`$test `",
  command: async (client: Client, message: Message, args: string[]) => {
    const path = require("path");

    message.channel.send({
      files: [path.join(__dirname, "..", "assets", "wild_hunt_shock_01.wav")],
    });
  },
};

addListenCommands(commands);
addScreenshotReactionListener(client);

client.on("ready", () => {
  console.log("The Caretaker is ready");

  const log_channel = client.channels.cache.get(LOG_CHANNEL_ID);

  if (log_channel) {
    // log_channel.send("Hello, i just restarted :wave:").catch(console.error);
  }
});

client.on("messageCreate", (message) => {
  antibot_handler(message, client);
  thread_channel_handler(message, client);
  prompt_handler(message, client);

  if (message.content.startsWith(COMMANDS_PREFIX)) {
    const args = message.content.replace(/[$][ ]*/, "").split(" ");
    const [command, ...argv] = args;

    if (command in commands) {
      try {
        return commands[command].command(client, message, argv);
      } catch (err) {
        return consume(
          client,
          message,
          "Error",
          `error when running command \`${command}\`: ${err}`,
          "red"
        );
      }
    }

    return consume(
      client,
      message,
      "Error",
      `no such command \`${command}\``,
      "red"
    );
  }

  /**
   * listen if the bot can answer with a listener
   */
  if (!message.author.username.includes("Caretaker")) {
    listenForMessage(message);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) {
    return;
  }

  if (interaction.customId === "delete_listen") {
    interaction.message.delete().catch((e) => console.error(e));
  }

  antibot_interaction_handler(interaction, client);
  activeUserInteractionHandler(interaction, client);
});

client.on("guildBanRemove", async (guild, user) => {
  var banlana = [
    "**The wounds can be healed, but never hidden.**",
    "**has been unbanned. Compassion is a rarity in the fevered pitch of anger.**",
    "**was unbanned. Patched up, if only to bleed again.**",
    "**has been unbanned. A death denied, for now.**",
    "**is unbanned! How quickly the tide turns!**",
    "**has been unbanned! A moment of valor shines brightest against a backdrop of despair.**",
    "**was unbanned. A moment of clarity in the eye of the storm.**",
  ];

  var result = Math.floor(Math.random() * banlana.length + 0);

  guild.channels.cache
    .get("755190155093999746")
    .send(user.tag + " " + banlana[result])
    .catch(console.error);
});

client.on("guildBanAdd", async (guild, user) => {
  const banlana = [
    "**has been banned. This one has become mindless, useless. Let them find comfort within the earth, among the worms.**",
    "**was dispatched. Suffer not the lame horse... nor the broken man.**",
    "**has been dismissed. Another soul battered and broken, cast aside like a spent torch.**",
    "**has been banned. It is done. Turn yourself now to the conditions of those poor devils who rest six feet under.**",
    "**was dismissed. Wounds to be tended; lessons to be learned.**",
    "**has been banned. Their flame of rot flicker, in the minds of who remains...**",
    "**was annihilated. Did he foresee his own demise? I care not, so long as he remains as remains.**",
    "**was dispatched. He is as grotesque in death as he was in life...**",
    "**has been felled. Fitting, that he find his rest upon the dirt he harrowed so fruitlessly.**",
    "**was banned! Executed, with impunity!**",
    "**has been banned! Witness, their tainted blood still on the concrete stone!**",
    "**has been eradicated! Mortality clarified in a single strike!**",
    "**was banned. Those who covet punishment find it in no short supply.**",
    "**has been banned. Wounds to be tended; lessons to be learned.**",
    "**has been banned. Worth of freedom is best taught through restriction. Now, hush.**",
    "**has been dismissed. The unruly require instruction, not sympathy.**",
    "**has been banned! Value the punishment you craved!**",
    "**was banned. As above, so below. You reap what you sow.**",
    "**was banned. No gaze other than a gun's muzzle could virtue his kind.**",
    "**was banned. A thoughtless voice among the thoughtful few. Becomes silence, his only virtue...**",
    "**has been dismissed. The disobedient should be taught what to think, not how to think.**",
  ];

  const result = Math.floor(Math.random() * banlana.length + 0);

  guild.channels.cache
    .get("755188754540527646")
    .send(user.tag + " " + banlana[result])
    .catch(console.error);
});

client.on("guildMemberAdd", async (member) => {
  const banlana = [
    "Welcome home, such as it is. A living breathing question that you will perhaps become the answer of.",
    "has come to join the workshop, their purpose unknown to me...",
    "You answered the invitation - now like me, you are part of this place!",
    "is here! Fan the flames! Mold the metal! We are raising an army!",
    "has arrived. Searching where others will not go... and seeing what others will not see.",
    "is here. A mighty comrade anchored by a holy purpose. A zealous fighter!",
    "appears elusive, evasive, persistent... Righteous traits for a rogue!",
    "has come and will be laughing still... at the end...",
    "has arrived! Another book falls onto the table of Earth!",
    "is here! A champion marksman keen for a new kind of challenge.",
    "has arrived! A formidable sight keen to delve into the darkest of storms!",
    "Welcome aboard. Secrets and wonders can be found in the most tenebrous corners of this place!",
    "has arrived! A time to perform beyond one's limits!",
    "has arrived. Please remind yourself that overconfidence is a slow and insidious killer.",
  ];

  const result = Math.floor(Math.random() * banlana.length + 0);

  member.guild.channels.cache
    .get("755190155093999746")
    .send(`${member}` + " " + banlana[result])
    .catch(console.error);
});

client.on("guildMemberRemove", async (member) => {
  const banlana = [
    "has left. Those without the stomach for this place must move on.",
    "has left the workshop, with a battered, broken tale.",
    "has retreated. A setback, but not the end of things!",
    "has left. We will endure this loss, and learn from it.",
    "has left. To desert for such a little thing... a bite of bread..!",
    "has left. A farewell so sudden...",
    "has left. Picked by the crows like wheat.",
    "has left. Another tale ended.",
    "has left. More dust, more ashes, more disappointment...",
    "has retreated. Wherefore, heroism?",
  ];

  const result = Math.floor(Math.random() * banlana.length + 0);

  member.guild.channels.cache
    .get("755188754540527646")
    .send(member.user.tag + " " + banlana[result])
    .catch(console.error);
});
