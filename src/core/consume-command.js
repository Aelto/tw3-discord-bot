const Discord = require('discord.js')

module.exports = function consumeCommand(client, message, title, output, color = 'default', keep_original_message = false) {
  const deleted_promise = keep_original_message
    ? Promise.resolve()
    : message.delete();

  deleted_promise
  .then(msg => {

    let embedColor = 0
    switch (color) {
      case 'blue':
        embedColor = 3447003 // 555200
        break;

      case 'green':
        embedColor = 3066993
        break;

      case 'red':
        embedColor = 15158332// 0x#FF0000;
    
      default:
        break;
    }

    const embed = new Discord.MessageEmbed()
      .setColor(embedColor)
      .setAuthor({
        name: client.user.username,
        icon_url: client.user.avatarURL
      })
      .setTitle(title)
      .setDescription(String(output))
      .setTimestamp(new Date())
      .setFooter({
        icon_url: message.author.avatarURL,
        text: message.author.username
      });

    return output
      ? message.channel.send({ embeds: [embed] }).catch(console.error)
      : message.channel.send(title).catch(console.error);
  })
  .then(msg => {
    setTimeout(() => {
      msg.delete()
      .catch(err => message.channel.send(err))
      .catch(console.error);
    }, 1 * 60 * 1000)
  })
  .catch(err => {
    const out = `[in] \`${message}\`\n${output}\nERROR, something went wrong`

    console.log(err);

    const embed = new Discord.MessageEmbed()
      .setAuthor({
        name: client.user.username,
        icon_url: client.user.avatarURL
      })
      .setTitle('Error, something went wrong')
      .setDescription(String(err))
      .setColor(0)
      .setTimestamp(new Date());

    message.channel.send({ embeds: [embed] })
    .catch(console.error)
    .then(msg => {
      setTimeout(() => {
        msg.delete()
          .catch(error => console.log(error))
      }, 1 * 60 * 1000)
      })
  })
}