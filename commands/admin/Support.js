const { SlashCommandBuilder,PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('support')
		.setDescription('If you need to contact the creator of this bot, use this slash command to get my email')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		async execute(interaction) {
            await interaction.reply
			(`Hi, I am Faez and let me be the first to say thank you for inviting Evii Bot into your server. This series of messages will guide you through what the bot does and its slash commands that helps fine tune the bot according to your moderation needs. If you need further help, have feature suggestions or submit a bug report, please email me at faezsubmarine@gmail.com

MAIN FUNCTION

You do not need to do anything, as the bot work right out of the box. When someone posted a link in a text channel where it is permitted, it will record the link into the database. The amount of time the bot waits for until it forgets the link is an hour by default but you can change how long a bot waits until it forgets a link. If, however, a link was reposted, even if it was from the same user, the bot will respond according to its settings.

TYPES OF MODES

In Response Mode, the bot will respond to the repost. In Delete Mode, the bot will delete the repost and then create a message to acknowledge that it does delete the repost.

LIST OF COMMAND

/addtourlignorelist

If you want the bot to ignore a link whenever it's posted, then use this slash command. For example \`/addtourlignorelist youtube.com\` will ignore ANY link that contains "youtube.com". You can also add multiple URLs with one command by seperating each domain with space like so \`/addtourlignorelist example1.com example2.com\`. If the URL was already stored in the database, calling this command will delete those URLs from the database. 


/addtouserignorelist

If there is a user whose URLs you want to ignore, you can ignore them using this command like so:  \`/addtouserignorelist exampleuser\`. You can also add multiple users with one command by seperating each usernames with space like so \`/addtourlignorelist exampleuser1 exampleuser2\`. If the user's URLs was already stored in the database, calling this 
command will delete those URLs from the database.

/directlyforgetlink

If, for whatever reason, you want the bot to forget a specific link, you can use this slash command to forget it, like so \`/directlyforgetlink www.example.com\`. Do note that you have to type in the EXACT url for this command to work.

/forgeturltoggle

There is a toggle in the bot that determines whether the bot will keep or forget the link after a repost. If this toggle is on, the bot will forget the link after a repost. Otherwise, the bot will keep the link until its timeout is over, see /settimeout above for more info.

/getallurls

Gets all the URLs that had been posted on this server and stored on the database.

/getsettingproperties

Gets all the settings set for Evii Bot for this server. It returns mode, forget URL toggle, URL ignore list, user ignore list and time out.

/removefromurlignorelist

Remove a domain from a url ignore list. To do so, type \`/removefromurlignorelist exampledomain.com\`. Do note that you have to type exactly what domain you want to remove. You can also remove multiple URLs with one command by seperating each domain with space like so \`/removefromurlignorelist exampledomain1.com exampledomain2.com\`.

/removefromuserignorelist

Remove a user from a user ignore list. To do so, type \`/removefromuserignorelist exampleuser\`. Do note that you have to type exactly which user you want to remove. You can also remove multiple user with one command by seperating each domain with space like so \`/removefromuserignorelist user1 user2\`

/resetserver

Deletes all URLs stored on the database and reset server setting.

/setmode

The bot currently has two modes: Response Mode and Delete Mode. It can be set by using /setmode and then its corresponding number. For example, \`/setmode 0\` for Response Mode, and \`/setmode 1\` for Delete Mode.

/settimeout

This slash command determines how long the bot will wait until they forget a link. By default, the wait will be an hour long, however, you can use the slash command to set your own wait time. If you want the bot to wait 3 days, for example, you can use the command as \`/settimeout 3d\`, or \`/settimeout 72h\`, or \`/settimeout 2d24h\`. The minimum amount of time you can input is an hour, the maximum amount is 7 days. Do note that if the timeout is set and the link lifespan is longer than the timeout, then the bot will forget the link.
`);  
		}
};