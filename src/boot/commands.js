const {loadModules, rest} = require("../util");
const discord = require("discord.js");

module.exports = async (client, guild) => {
    let builders = [];
    loadModules(process.cwd() + "/src/commands").forEach(m => {
        builders.push(m.builder);
        client.on('interactionCreate', async interaction => {
            if(!interaction.isChatInputCommand()) return;
            // We need to handle only events from this guild.
            if(!interaction.guild.equals(guild)) return;
            if(interaction.commandName !== m.name) return;
            m.on(interaction);
        });
        if(m.hasOwnProperty("onLoad")) {
            m.onLoad(client, guild);
        }
    });
    await rest.put(discord.Routes.applicationGuildCommands(client.application.id, guild.id), {
        body: builders.map(b => b.toJSON())
    });
};