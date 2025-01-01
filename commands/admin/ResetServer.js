const { SlashCommandBuilder,PermissionFlagsBits, ComponentType, ButtonBuilder,ButtonStyle,ActionRowBuilder } = require('discord.js');
const {resetGuild} = require('../../service/AdminService.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resetserver')
		.setDescription('Remove all links stored for this server, as well resetting the settings')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		async execute(interaction) {
			const collectorFilter = i => {
				i.deferUpdate();
				return i.user.id === interaction.user.id;
			};
			const confirm = new ButtonBuilder()
			.setCustomId('confirm')
			.setLabel('Confirm')
			.setStyle(ButtonStyle.Success);

			const cancel = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Danger);

			const row = new ActionRowBuilder()
			.addComponents(confirm,cancel);

			await interaction.reply({
				content: `Are you sure you want to delete all of the links and reset the settings? This is not reversible. You have ten seconds to click on the button`,
				components: [row],
			});
			const message = await interaction.fetchReply();

			message.awaitMessageComponent({ filter: collectorFilter, componentType: ComponentType.Button, time: 10_000 })
			.then(i =>{
				
				switch(i.customId){
					case "confirm":
						resetGuild(interaction.guildId);
						interaction.editReply("Got it! Resetting the server!")
						break;
					case "cancel":
						interaction.editReply("Got it! Nothing will happen")
						break;
				}
				message.edit({components:[]})
			})
			.catch(err => console.log('Seems like you did not press any buttons in time. Canceling.'+err));
		}
};