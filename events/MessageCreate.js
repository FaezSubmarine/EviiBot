const { Events, PermissionFlagsBits } = require('discord.js');

const {findLink,assessLink,messageRepost, checkModeOfEachGuild,DeleteAndNotifyMessage} = require('../service/MessageService.js')

module.exports = {
    name: Events.MessageCreate,
    async execute(message){
        if (message.author.bot) return;
        let URLs = findLink(message.content);
        if (URLs == null) return;
        let res = await assessLink(URLs,message)
        if(res.length == 0)return;
        let checkMode = await checkModeOfEachGuild(message.guildId)
        switch(checkMode){
            case 0:
                await messageRepost(res,message)
                break
            case 1:
                await DeleteAndNotifyMessage(res,message)
                break
        }
    }
}