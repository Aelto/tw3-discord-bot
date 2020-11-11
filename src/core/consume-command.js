const Discord = require('discord.js')

module.exports = function consumeCommand(client, message, title, output, color = 'default') {
  message.delete()
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

    return output
      ? message.channel.send('', {
          embed: {
            author: {
              name: client.user.username,
              icon_url: client.user.avatarURL
            },
            title: title,
            description: String(output),
            color: embedColor,
            timestamp: new Date(),
            footer: {
              icon_url: message.author.avatarURL,
              text: message.author.username
            }
          }
        })
      : message.channel.send(title)
  })
  .then(msg => {
    setTimeout(() => {
      msg.delete()
      .catch(err => message.channel.send(err))
    }, 1 * 60 * 1000)
  })
  .catch(err => {
    const out = `[in] \`${message}\`\n${output}\nERROR, something went wrong`

    console.log(err)

    message.channel.send('', {
      embed: {
        author: {
          name: client.user.username,
          icon_url: client.user.avatarURL
        },
        title: 'Error, something went wrong',
        description: String(err),
        color: 0,
        timestamp: new Date()
      }
    })
    .then(msg => {
      setTimeout(() => {
        msg.delete()
          .catch(error => console.log(error))
      }, 1 * 60 * 1000)
      })
  })
}