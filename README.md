## Behold

# Evii Bot

### Background:

In the discord server that I was in, sometimes someone did not read the links that someone else posted and sometimes that someone would post the same link as the one they did not read. The rest of us would point it out and then clown on them for a good natured laugh. Truthfully, it's the entire server's in-joke, most of us done it at one point or another, but there's one friend on there who said that this is one of the only good jokes in his repertoire, which is a bold faced lie since he does have way more good jokes than that, is this. So, I decided to automate this joke for him.

### Typical Usage:

When someone posted a valid link that this bot has not seen before, it will save it to a neo4j database like so: (Guild)-[hasUser]->(User)-[hasPosted]->(link). After 7 days, if no one had posted the same link, the link node will be deleted, as well as the user node if it does not have any outcoming relationships, same goes for guilds. However, if someone did post the same link within that 7 days, the bot will send a message, with that same link, to the same channel, and then delete the link from the database.
