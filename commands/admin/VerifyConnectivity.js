const { SlashCommandBuilder,PermissionFlagsBits } = require('discord.js');
const {verifyConnectivity} = require('../../service/AdminService');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('verifyconnectivity')
		.setDescription('check my connection to the database')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		async execute(interaction) {
            try{
                await verifyConnectivity();
            }catch(e){
                console.log(e)
                await interaction.reply(`Woops, looks like there's an issue with me connecting to my database`);
            }
            await interaction.reply(`All good here`);  
		}
};