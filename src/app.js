const {Client, GatewayIntentBits, REST} = require("discord.js");
const {loadModules, rest} = require("./util.js");
const API = require("./api.js");
const winston = require("winston");
const config = require("../config.json");
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});
const client = new Client({intents: [GatewayIntentBits.Guilds]});
const handleBoot = (g) => {
    loadModules(process.cwd() + "/src/boot").forEach(m => {
        // Format: (Client, Guild) => Void
        m(client, g);
    });
};
client.on('guildCreate', handleBoot);
client.once('ready', c => {
    for(let g of c.guilds.cache.values()) {
        // Handle boot also for already loaded guilds.
        handleBoot(g);
    }
});
client.login(config.token).then(r => {
    logger.info("Started up!");
});

module.exports = {

}