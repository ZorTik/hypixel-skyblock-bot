const config = require("../config.json");
const discord = require("discord.js");
const fs = require("fs");
const rest = new discord.REST({version: '10'}).setToken(config.token);

function loadModules(path) {
    const stat = fs.statSync(path);
    const modules = [];
    if(stat.isDirectory()) {
        for(let fn of fs.readdirSync(path)) {
            modules.push(loadModules(path + "/" + fn));
        }
        return modules;
    } else {
        return require(path);
    }
}

module.exports = {
    loadModules,
    rest
};