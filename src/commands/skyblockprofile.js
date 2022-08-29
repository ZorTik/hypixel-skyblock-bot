const discord = require("discord.js");
const api = require("../api.js");
const {ActionRowBuilder, ButtonBuilder} = require("discord.js");
const {fetch} = require("cross-fetch");
const {ButtonStyle} = require("discord-api-types/v10");

// User id - Profiles
const lastFetchCache = {};
const currentPageIndex = {};

function handleProfile(interaction, profile, index, edit = false) {
    const nickname = profile["nickname"];
    const uuid = profile["uuid"];
    // Discord user
    const user = profile["user"];
    const profileUser = Object.values(profile["members"])[index];
    function objectivesByStatus(status) {
        return Object.values(profileUser["objectives"]).filter(o => o["status"] === status);
    }
    const data = {
        content: "I've found it!",
        embeds: [{
            title: `Profile of ${nickname}`,
            description: `Showing Hypixel SkyBlock profile ${profile["cute_name"]}\nand it's ${index+1}. member.`,
            thumbnail: {
                url: `https://crafatar.com/renders/head/${uuid}?overlay=true`
            },
            fields: [
                {name: "Last Activity:", value: new Date(profileUser["last_save"]).toLocaleString(), inline: true},
                {name: "First Join:", value: new Date(profileUser["first_join"]).toLocaleString(), inline: true},
                {name: "Purse:", value: `$${Math.round(profileUser["coin_purse"])}`, inline: false},
                {name: "Kills:", value: `${profileUser["stats"]["kills"]}`, inline: true},
                {name: "Deaths:", value: `${profileUser["stats"]["deaths"]}`, inline: true},
                {name: "K/D:", value: `${
                    profileUser["stats"]["deaths"] > 0 ? profileUser["stats"]["kills"]/profileUser["stats"]["deaths"] : 1.0
                }`, inline: true},
                {name: "Objectives (Done):", value: objectivesByStatus("COMPLETE").length, inline: true},
                {name: "Objectives (Active):", value: objectivesByStatus("ACTIVE").length, inline: true},
                {name: '\u200B', value: '\u200B'},
                {name: "Showing Member:", value: `${index+1}/${Object.values(profile["members"]).length}`},
            ],
            footer: {text: "Hypixel SkyBlock Bot"},
        }],
        components: [new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`sbpage-prev-${user.id}`)
                    .setLabel("<")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(index === 0),
                new ButtonBuilder()
                    .setCustomId(`sbpage-next-${user.id}`)
                    .setLabel(">")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(index >= Object.values(profile["members"]).length - 1)
            )
        ]
    };
    edit ? interaction.editMessage(interaction.message.id, data) : interaction.reply(data);
}

module.exports = {
    name: "skyblockprofile",
    builder: new discord.SlashCommandBuilder()
        .setName("skyblockprofile")
        .setDescription("Replies with player's profile/profiles.")
        .addStringOption(option => option
            .setName("nickname")
            .setDescription("Player's nickname")
            .setRequired(true)),
    on: async (interaction) => {
        const nickname = interaction.options.getString("nickname");
        const data = await fetch(`https://playerdb.co/api/player/minecraft/${nickname}`)
            .then(r => r.json());
        if(data.code === "player.found") {
            const uuid = data["data"]["player"]["id"];
            const profiles = await api.getProfiles(uuid);
            lastFetchCache[interaction.user.id] = profiles.map(p => {
                return {
                    nickname: nickname,
                    uuid: uuid,
                    ...p
                };
            });
            currentPageIndex[interaction.user.id] = 0;

            interaction.reply({
                embeds: [{
                    title: "Please select profile!",
                    description: `Select one of these ${profiles.length} profiles, please.`
                }],
                components: [new ActionRowBuilder()
                    .addComponents(...function() {
                        return profiles.map(p => new ButtonBuilder()
                            .setCustomId(p["profile_id"])
                            .setLabel(p["cute_name"])
                            .setStyle(ButtonStyle.Primary));
                    }())],
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: "Player not found!",
                ephemeral: true
            });
        }
    },
    onLoad: async (client, guild) => {
        client.on('interactionCreate', (interaction) => {
            if(!interaction.isButton()) return;

            const stored = lastFetchCache[interaction.user.id]
            if(stored != null) {
                stored.forEach(p => {
                    if(p["profile_id"] === interaction.customId) {
                        if(interaction.customId.startsWith("sbpage-")
                            && interaction.customId.split("-")[2] === interaction.user.id) {
                            try {
                                const pageAddon = parseInt(interaction.customId.split("-")[1]);
                                currentPageIndex[interaction.user.id] += pageAddon;
                                handleProfile(interaction, {
                                    user: interaction.user,
                                    ...p
                                }, currentPageIndex[interaction.user.id]);
                            } catch(e) {
                                console.log(e);
                            }
                        } else {
                            handleProfile(interaction, {
                                user: interaction.user,
                                ...p
                            }, 0);
                        }
                    }
                });
            }
        });
    }
}