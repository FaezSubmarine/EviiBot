const { SlashCommandBuilder,PermissionFlagsBits } = require('discord.js');
const {insertUserIntoIgnoreList} = require('../../service/AdminService.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('addtouserignorelist')
		.setDescription('give the bot usernames to ignore their link')
		.addStringOption(option=>
			option.setName('user')
			.setDescription('enter the username IE NOT the display name but the name below it')
			.setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		async execute(interaction) {
			try{
                //https://stackoverflow.com/questions/61664205/get-the-list-of-all-user-on-a-server-discord-js
                //fetching force the bot to get ALL guild members
				let res = await interaction.guild.members.fetch()
				//first gets userIDS from the user option, then map it out to a user class, then return an id if userClass exist
				let userIDs = interaction.options.getString("user").split(' ').map(user=>{
                    let userClass = res.find(u =>u.user.username==user)
					return userClass?.id
                }).filter(x=>typeof x !== "undefined")

                if(userIDs.length==0 || (userIDs.length==1 && typeof userIDs[0] === "undefined")){
                    await interaction.reply("woops, looks your input does not match any username I know of");
					return;
                }
				let userRes = await insertUserIntoIgnoreList(interaction.guildId,userIDs)
				let msg = "Got it! Added ";
				for(let i = 0;i< userRes.length;++i){
					let username = res.find(u=>{
						return u.user.id==userRes[i]
					}).user.username
					msg+= (i==userRes.length-1 && userRes.length!=1)?(`and ${username} `):(username+" ")
				}
                msg+= "into the user ignore list."
                await interaction.reply(msg);  
			}
			catch(e){
				console.log(e)
				await interaction.reply(e);
			}
		}
};