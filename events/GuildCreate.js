const { Events } = require('discord.js');

const {mergeGuild} = require('../service/MessageService.js')

module.exports = {
    name: Events.GuildCreate,
    once:true,
    async execute(g){
        await mergeGuild([g.id]);
    }
}