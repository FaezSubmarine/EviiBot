const { SlashCommandBuilder } = require('discord.js');
const {checkInput} = require('../../service/AdminService.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('settimeout')
		.setDescription('Set how long does it take for EviiBot to forget a link.')
		.addStringOption(option=>
			option.setName('input')
			.setDescription('e.g 1d1h where d is the number of days and h is the number of hours. Minimum is 1 hour')
			.setRequired(true)
		),
		async execute(interaction) {
			checkInput(interaction);
			// await interaction.deferReply();
			// interaction.fetchReply()
			// 	.then(reply => console.log(`Replied with ${reply.content}`))
			// 	.catch(console.error);
			// interaction.editReply("pong");
			//await interaction.deleteReply();
			//await checkInput(interaction);
			//await interaction.deleteReply();

	}
};