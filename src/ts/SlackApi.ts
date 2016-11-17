/// <reference path="../typings/google-apps-script.script.d.ts" />
/// <reference path="../typings/google-apps-script.url-fetch.d.ts" />
/// <reference path="../typings/google-apps-script.cache.d.ts" />
/// <reference path="../typings/google-apps-script.properties.d.ts" />
/// <reference path="../typings/gas-library.d.ts" />

/**
 * Create an Slack API Client
 * @param {String} token API Token via https://api.slack.com/tokens
 * @return {SlackApi} return an Slack API Client
 */
function create(token: string){
    return new SlackApi(token);
}
/**
 * @type {String}
 */
const SCOPE_IDENTIFY="identify";
/**
 * @type {String}
 */
const SCOPE_READ="read";
/**
 * @type {String}
 */
const SCOPE_POST="post";

let _this = this,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
class SlackApi{
    token:string;
    BASE_URI = "https://slack.com";
    API_ENDPOINT = this.BASE_URI + "/api/";
    AUTH_ENDPOINT = this.BASE_URI + "/oauth/authorize";
    cache : GoogleAppsScript.Cache.CacheService;
    option = this.option != null ? this.option : {};
    prop = PropertiesService.getUserProperties();
    constructor(_token: string,_method?:string) {
        this.token = _token;
        if (!(this.token != null)) throw new Error("the token is required");
    }
    urlFetch_(rpcMethod:string, param?:Object, option?:Object):JSON{
        let opt, res, self = this;
        if (param == null) param = {};
        if (option == null) option = {};
        opt = {
            method: "POST",
            payload: param
        };
        opt.payload.token = this.token;
        return JSON.parse(UrlFetchApp.fetch(this.API_ENDPOINT + rpcMethod, opt).getContentText());
    }
    authRevoke(test:boolean):JSON{
        let methodUrl = "auth.revoke";
        return this.urlFetch_(methodUrl,{ "test" : test });
    }
    authTest():JSON{
        let methodUrl = "auth.test";
        return this.urlFetch_(methodUrl);
    }
    botsInfo(bot:string):JSON{
        let methodUrl = "bots.info";
        return this.urlFetch_(methodUrl,{ "bot" : bot });
    }
    channelsArchive(channel:string):JSON{
        let methodUrl = "channels.archive";
        return this.urlFetch_(methodUrl,{ "channel" : channel });
    }
    channelsCreate(name:string):JSON{
        let methodUrl = "channels.create";
        return this.urlFetch_(methodUrl,{ "name" : name });
    }
    channelsHistory(channel:string,latest?:number,oldest?:number,inclusive?:number,count?:number,unreads?:number):JSON{
        let methodUrl = "channels.history";
        let param = { "channel" : channel };
        if(latest != null){param["latest"] = latest;}
        if(oldest != null){param["oldest"] = oldest;}
        if(inclusive != null){param["inclusive"] = inclusive;}
        if(count != null){param["count"] = count;}
        if(unreads != null){param["unreads"] = unreads;}
        return this.urlFetch_(methodUrl,param);
    }
}
