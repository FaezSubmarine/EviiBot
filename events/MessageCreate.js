const { Events, PermissionFlagsBits } = require('discord.js');

const {findLink,assessLink} = require('../service/MessageService.js')

module.exports = {
    name: Events.MessageCreate,
    async execute(message){
        if (message.author.bot) return;
        //console.log(message.member.permissions.has(PermissionFlagsBits.ManageGuild))
        let URLs = findLink(message.content);
        if (URLs == null) return;
      
        assessLink(URLs,message)
    }
}