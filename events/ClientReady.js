const { Events } = require('discord.js');

const {mergeGuild} = require('../service/MessageService.js')

module.exports = {
    name: Events.ClientReady,
    once:true,
    async execute(c){
        console.log(`Ready! Logged in as ${c.user.tag}`);

        const guilds = c.guilds.cache.map(guild => guild.id);
      
        await mergeGuild(guilds);
    }
}