const { SlashCommandBuilder,PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('support')
		.setDescription('If you need to contact the creator of this bot, use this slash command to get my email')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		async execute(interaction) {
            await interaction.reply(`My email is faezsubmarine@gmail.com`);  
		}
};