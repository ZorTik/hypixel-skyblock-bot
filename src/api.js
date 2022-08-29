const {fetch} = require("cross-fetch");

class API {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.url = "https://api.hypixel.net";
    }
    async getProfiles(uuid) {
        const res = await this.makeRequest("/skyblock/profiles",
            "GET",
            undefined,
            {
                params: {
                    uuid: uuid
                }
            });
        if(res.hasOwnProperty("cause")) {
            return res.cause;
        } else if(res.hasOwnProperty("profiles")) {
            return res.profiles;
        } else return null;
    }
    async makeRequest(path, method = "GET", body = undefined, _options = {}) {
        let url = this.url + path;
        if(_options.hasOwnProperty("params")) {
            for(let key of Object.keys(_options.params)) {
                if(!url.includes("?")) {
                    url += "?";
                }
                url += key + "=" + _options.params[key];
            }
        }
        const options = {
            ..._options,
            method: method,
            headers: {
                "API-Key": this.apiKey
            }
        };
        if(body !== undefined && method !== "GET") {
            options.body = body;
        }
        return fetch(url, options).then(res => res.json());
    }
}

const config = require("../config.json");
const api = new API(config.apiKey);

module.exports = api;