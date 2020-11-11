const Discord = require('discord.js');
const fs = require('fs');

const consume = require('./core/consume-command.js');

const COMMANDS_PREFIX = '$';
const MAIN_CHANNEL_ID = '728022549283340351';
const ADMIN_ROLE_ID = "746855968889110549";
const WARNED_ROLE_1_ID = '774254557043097651';
const WARNED_ROLE_2_ID = '728733165509673010';

const client = new Discord.Client();
client.login('');

/**
 * if set to a value, the next message received from `author`
 * in the specific `channel` will be used to resolve `waiting_promise`
 */
let waiting_answer_from = {
  channel: null,
  author: null,
  waiting_promise_resolver: null
};

function prompt(message, question, delay = 60) {
  return new Promise((resolve, reject) => {
    waiting_answer_from.channel = message.channel;
    waiting_answer_from.author = message.author;

    waiting_answer_from.waiting_promise_resolver = v => {
      remove_waiting_answer();

      return resolve(v);
    };

    consume(
      client,
      message,
      `Please answer in less than ${delay}s`,
      question,
      'blue'
    );

    setTimeout(() => {
      remove_waiting_answer();

      reject('timeout');
    }, delay * 1000);
  });
}

function remove_waiting_answer() {
  waiting_answer_from.channel = null;
  waiting_answer_from.author = null;
  waiting_answer_from.waiting_promise_resolver = null;
}

function getUserFromMention(mention) {
	if (!mention) return;

	if (mention.startsWith('<@') && mention.endsWith('>')) {
		mention = mention.slice(2, -1);

		if (mention.startsWith('!')) {
			mention = mention.slice(1);
		}

		return client.users.cache.get(mention);
	}
}

const commands = {};

commands['help'] = {
  name: 'help',
  help: '`$help`: show help message',
  command: (client, message) => {
    const helpMessage = Object.keys(commands).reduce((acc, name) => {
      const command = commands[name];
      acc += `- **${command.name}** ${command.help}\n`;

      return acc;
    }, '');

    consume(
      client,
      message,
      'Here is a list of the commands and what they do',
      helpMessage,
      'blue'
    );
  }
};

commands['report'] = {
  name: 'report',
  help: '`$report @user [message-id]` to report a user and optionally link to the offensive message',
  command: async (client, message, args) => {
    const delay = 60;

    const author_member = message.guild.members.cache.get(message.author.id);
    const has_admin_role = author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
    if (!has_admin_role) {
      return consume(
        client,
        message,
        "Missing permissions",
        "You don't have the sufficient role to report someone",
        'red'
      );
    }

    let reported_user = null;
    if (!args[0]) {
      const who_answer = await prompt(
        message,
        `Looks like you forgot who to report, who do you want to report. @ him please.`,
        delay
      );

      reported_user = getUserFromMention(who_answer.content);
    }
    else {
      reported_user = getUserFromMention(args[0]);
    }

    

    const reported_member = message.guild.members.cache.get(reported_user.id);

    let report_confirmed = false;
    let level = 0;
    try {
      let confirm;

      if (!reported_member.roles.cache.has(WARNED_ROLE_1_ID) && !reported_member.roles.cache.has(WARNED_ROLE_2_ID)) {
        confirm = await prompt(
          message,
          `Do you confirm you want to report ${reported_user.username}, this will be his 1st offense`,
          delay
        );

        level = 1;
      }
      else if (reported_member.roles.cache.has(WARNED_ROLE_1_ID)) {
        confirm = await prompt(
          message,
          `Do you confirm you want to report ${reported_user.username}, this will be his 2nd offense`,
          delay
        );

        level = 2;
      }
      else if (reported_member.roles.cache.has(WARNED_ROLE_2_ID)) {
        confirm = await prompt(
          message,
          `Do you confirm you want to report ${reported_user.username}, this will be his 3nd and last offense`,
          delay
        );

        level = 3
      }

      report_confirmed = confirm.content.toLowerCase().includes("yes");
    } catch (err) {

    }

    if (report_confirmed) {
      message.channel.send([
        `Great.`,
        `I didn't like ${reported_user} anyway`
      ])
      .then(() => {

        if (level === 1) {
          reported_member.roles.add(WARNED_ROLE_1_ID);
          return message.guild.channels.cache.get(MAIN_CHANNEL_ID).send('', {
            embed: {
              author: {
                name: client.user.username,
                icon_url: client.user.avatarURL
              },
              title: "Reported user",
              description: String(`<@${reported_user.id}> has been reported by the peacekeepers and is now **warned**. The third report results in an automatic kick from the server`),
              color: 15158332,
              timestamp: new Date(),
              footer: {
                icon_url: reported_user.avatarURL,
                text: reported_user.username
              }
            }
          });
        }
        else if (level === 2) {
          reported_member.roles.remove(WARNED_ROLE_1_ID);
          reported_member.roles.add(WARNED_ROLE_2_ID);
        }
        else {
          reported_member.kick("You were kicked from the server due to repeated offenses");
        }

      })
      .then(() => {
        remove_waiting_answer();
      });
    }
    else {
      message.channel.send([
        `Reports towards ${reported_user} were cancelled`
      ])
      .then(() => {
        remove_waiting_answer();
      })
    }

    
  }
}


class Mod {
  constructor(name, link, description) {
    this.name = name;
    this.link = link;
    this.description = description || '';
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
    requests
  };

  fs.writeFileSync('mods-database.json', JSON.stringify(content, null, '  '), { encoding: 'utf-8' });
}

function getModDatabase() {
  registered_mods.clear();
  mod_requests.clear();

  if (!fs.existsSync('mods-database.json')) {
    return;
  }

  const content = JSON.parse(fs.readFileSync('mods-database.json', 'utf-8'));

  registered_mods = new Map(content.mods);
  mod_requests = new Map(content.requests);
}

commands['modregister'] = {
  name: 'modregister',
  help: '`$modregister <name> <link> [description]` to register a new mod',
  command: (client, message, args) => {
    if (args.length < 2) {
      return consume(
        client,
        message,
        'Cannot register your mod',
        `<@${message.author.id}>, to register a mod you must give a name, a link and optionally a description for the mod.`,
        'red'
      );
    }

    const [name, link, ...description] = args;

    mod_requests.set(args[0], new Mod(name, link, description.join(' ')));
    saveModDatabase();

    consume(
      client,
      message,
      'Thanks for registering a new mod',
      `<@${message.author.id}> has registered the mod ${args[0]}. It will be added to the database after a Peacekeeper has validater the request`,
      'blue'
    );
  }
}

commands['modrequests'] = {
  name: 'modrequests',
  help: '`$modrequests [id] [yes/no]` to get the pending requests & to accept/deny a specific request',
  command: (client, message, args) => {
    const author_member = message.guild.members.cache.get(message.author.id);
    const has_admin_role = author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
    if (!has_admin_role) {
      return consume(
        client,
        message,
        "Missing permissions",
        "You don't have the sufficient role to view the pending requests",
        'red'
      );
    }

    if (!args.length) {
      const pending_requests = Array.from(mod_requests.entries())
        .map(([name, {link}]) => `**${name}**: ${link}`);

      if (!pending_requests.length) {
        return consume(
          client,
          message,
          'No pending requests left',
          'No pending requests left',
          'red'
        );
      }

      consume(
        client,
        message,
        'Here is a list of all the pending requests i have',
        pending_requests.join('\n') || '',
        'green'
      );
    }
    else if (args.length == 1) {
      const pending_request = mod_requests.get(args[0])

      consume(
        client,
        message,
        'Here is the information i have on the pending request',
        [
          `**name**: ${pending_request.name}`,
          `**link**: ${pending_request.link}`,
          `**description**: ${pending_request.description}`
        ].join('\n'),
        'green'
      );
    }
    else {
      const pending_request = mod_requests.get(args[0]);
      const is_accepted = String(args[1]).toLowerCase() === 'yes';

      if (!mod_requests.has(args[0])) {
        return consume(
          client,
          message,
          'Cannot accept pending request',
          `There is no pending request for ${args[0]}`,
          'red'
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
          'Pending request accepted',
          `The mod **${args[0]}** was accepted and has been added to the database`,
          'green'
        );
      }

      consume(
        client,
        message,
        'Pending request denied',
        `The mod **${args[0]}** was denied and has been removed from the requests`,
        'red'
      );
    }
  }
}

commands['mods'] = {
  name: 'mods',
  help: '`$mods [name <name-search>] [search <keywords-search>]` to get the list of all mods, or retrieve one mod by its name or search among all mods description',
  command: (client, message, args) => {
    const [arg, ...search] = args;

    if (arg === 'name') {
      if (!registered_mods.has(search.join(' ').trim())) {
        return consume(
          client,
          message,
          'No mod found',
          `There is no mod with the name ${search}`,
          'red'
        );
      }

      const mod = registered_mods.get(search.join(' ').trim());
      const mod_information = [
        `**__${mod.name}__** - ${mod.link}`,
        mod.description
      ].join('\n');

      consume(
        client,
        message,
        'Here is the information i have about the mod',
        mod_information,
        'green'
      );
    }
    else if (arg === 'search') {
      const mods = Array.from(registered_mods)
        .filter(([name, { link, description }]) => search.some(s => name.includes(s) || description.includes(s)));

      consume(
        client,
        message,
        'Here is the information i have about the mod. (descriptions removed)',
        mods.map(([_, mod]) => `**__${mod.name}__** - ${mod.link}`).join('\n'),
        'green'
      );
    }
    else {
      const mods = Array.from(registered_mods);

      if (!mods.length) {
        return consume(
          client,
          message,
          'Here is a list of all the mods i know. (descriptions removed)',
          'No registered mod yet, use the `$modregister` command to add one',
          'red'
        );
      }

      consume(
        client,
        message,
        'Here is a list of all the mods i know. (descriptions removed)',
        mods.map(([_, mod]) => `**__${mod.name}__** - ${mod.link}`).join('\n'),
        'green'
      );
    }
  }
}

commands['modremove'] = {
  name: 'modremove',
  help: '`$modremove <name>` to remove a mod from the database',
  command: (client, message, args) => {
    const author_member = message.guild.members.cache.get(message.author.id);
    const has_admin_role = author_member && author_member.roles.cache.has(ADMIN_ROLE_ID);
    if (!has_admin_role) {
      return consume(
        client,
        message,
        "Missing permissions",
        "You don't have the sufficient role to remove a mod",
        'red'
      );
    }

    const [name] = args;

    if (!registered_mods.has(name)) {
      return consume(
        client,
        message,
        "No mod found",
        `No mod found with the name ${name}`,
        'red'
      );
    }

    registered_mods.delete(name);

    saveModDatabase();

    return consume(
      client,
      message,
      "Mod removed",
      `the mod **${name}** was removed from the database`,
      'green'
    );
  }
}

client.on('ready', () => console.log('The Caretaker is ready'));

client.on('message', message => {
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

  if (message.content.startsWith(COMMANDS_PREFIX)) {
    const args = message.content.replace(/[$][ ]*/, '').split(' ');
    const [command, ...argv] = args;

    if (command in commands) {
      return commands[command].command(client, message, argv);
    }
    
    return consume(
      client,
      message,
      'Error',
      `no such command \`${command}\``,
      'red'
    );
  }
});



client.on('guildBanRemove', async (guild, user) => {    
  
  var banlana = ["**The wounds of ban can be healed, but never hidden.**","**has been unbanned. Compassion is a rarity in the fevered pitch of battle.**","**was unbanned. Patched up, if only to bleed again.**","**has been unbanned. A death denied, for now.**","**is unbanned! How quickly the tide turns!**","**has been unbanned! A moment of valor shines brightest against a backdrop of despair.**","**was unbanned. A moment of clarity in the eye of the storm.**"]
  
  var result = Math.floor((Math.random() * banlana.length) + 0);
  
  guild.channels.cache.get("755190155093999746").send(user.tag+ " " +banlana[result]) 
});


client.on('guildBanAdd', async (guild, user) => {
  var banlana = ["**has been banned. This one has become vestigial, useless.**","**was killed by peacekeepers. Suffer not the lame horse... nor the broken man.**","**was banned. Another soul battered and broken, cast aside like a spent torch.**","**has been banned. It is done. Turn yourself now to the conditions of those poor devils who remain.**","**was dismissed. Send this one to journey elsewhere, for we have need of sterner stock.**","**has been banned. Slumped shoulders, wild eyes, and a stumbling gait - this one is no more good to us.**","**was annihilated by peacekeepers. Did he foresee his own demise? I care not, so long as he remains dead.**","**was murdered by peacekeepers. He is as grotesque in death as he was in life...**","**has been felled. Fitting, that he find his rest upon the dirt he harrowed so fruitlessly.**","**was banned! Executed, with impunity!**","**has been banned! Back to the pit!**","**has been eradicated by peacekeepers! Mortality clarified in a single strike!**","**was banned. Those who covet the ban find it in no short supply.**"]
  
  var result = Math.floor((Math.random() * banlana.length) + 0);
  
  guild.channels.cache.get("755188754540527646").send(user.tag+ " " +banlana[result]) 
});


client.on("guildMemberAdd", async member  => { 

  var banlana = ["**Welcome home, such as it is. This squalid hamlet, these corrupted lands, they are yours now, and you are bound to them.**","**Welcome home. Take a seat and let me share with you the terrible wonders I have come to know...**","**You answered the letter — now like me, you are part of this place...**","**is here! Fan the flames! Mold the metal! We are raising an army!**","**has arrived. She searches where others will not go... and sees what others will not see.**","**is here. A mighty sword-arm anchored by a holy purpose. A zealous warrior!**","**appears elusive, evasive, persistent. Righteous traits for a rogue!**","**will be laughing still... at the end...**","**has arrived! A sister of battle - pious and unrelenting!**","**is here. A champion marksman keen for a new kind of challenge.**","**has arrived! Towering, fierce, terrible! Nightmare made material!**","**Welcome home... Secrets and wonders can be found in the most tenebrous corners of this place.**","**has arrived! A time to perform beyond one's limits!**","**has arrived. Please remind yourself that overconfidence is a slow and insidious killer.**"]
  
  var result = Math.floor((Math.random() * banlana.length) + 0);
  
  member.guild.channels.cache.get("755190155093999746").send(`${member}`+ " " +banlana[result]) 
});


client.on("guildMemberRemove", async member => { 

  var banlana = ["**has left. Those without the stomach for this place must move on.**","**has left the workshop. The task ahead is terrible, and weakness cannot be tolerated.**","**has retreated. A setback, but not the end of things!**","**has retreated. Wounds to be tended; lessons to be learned.**","**has left. We will endure this loss, and learn from it.**","**has left. To fall for such a little thing... a bite of bread..!**","**has left. A death by inches...**","**has left. More blood soaks the soil, feeding the evil therein...**","**has committed suicide. This is no place for the weak, or the foolhardy.**","**has fallen. More dust, more ashes, more disappointment...**","**has retreated. Wherefore, heroism?**"]
  
  var result = Math.floor((Math.random() * banlana.length) + 0);
  
  member.guild.channels.cache.get("755188754540527646").send(member.user.tag+ " " +banlana[result]) 
});
