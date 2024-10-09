const { Events } = require('discord.js');

const {deleteGuildAndContent} = require('../service/MessageService.js')

module.exports = {
    name: Events.GuildDelete,
    once:true,
    async execute(g){
        await deleteGuildAndContent(g.id)
    }
}