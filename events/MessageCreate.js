const { Events, PermissionFlagsBits } = require('discord.js');

const {findLink,assessLink,messageRepost} = require('../service/MessageService.js')

module.exports = {
    name: Events.MessageCreate,
    async execute(message){
        if (message.author.bot) return;
        let URLs = findLink(message.content);
        if (URLs == null) return;
        let res = assessLink(URLs,message)
        messageRepost(res,message)
    }
}