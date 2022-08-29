const discord = require("discord.js");

module.exports = {
    name: "ping",
    builder: new discord.SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with pong to determine if the bot is running!"),
    on: async (interaction) => {
        await interaction.reply({
            content: "Pong!",
            ephemeral: true
        });
    }
}