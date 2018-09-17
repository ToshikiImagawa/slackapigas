/// <reference path="../typings/google-apps-script.script.d.ts" />
/// <reference path="../typings/google-apps-script.url-fetch.d.ts" />
/// <reference path="../typings/google-apps-script.cache.d.ts" />
/// <reference path="../typings/google-apps-script.properties.d.ts" />
/// <reference path="../typings/gas-library.d.ts" />
/// <reference path="../typings/slack.token.d.ts" />
/// <reference path="./SlackStorage.ts" />
/// <reference path="./SlackLock.ts" />
/// <reference path="./Utilities.ts" />

/**
 * Create an Slack API Client
 * @param {String} token API Token via https://api.slack.com/tokens
 * @return {SlackApi} return an Slack API Client
 */
function create(token: string): SlackApi {
    return new SlackApi(token);
}
/**
 * @type {String}
 */
const SCOPE_IDENTIFY: string = "identify";
/**
 * @type {String}
 */
const SCOPE_READ: string = "read";
/**
 * @type {String}
 */
const SCOPE_POST: string = "post";

let _this = this,
    __bind = function (fn, me) { return function () { return fn.apply(me, arguments); }; };

function GetRedirectUri(scriptId) {
    return `https://script.google.com/macros/d/${encodeURIComponent(scriptId)}/usercallback`;
}
class SlackApi {
    private token: string;
    private BASE_URI = "https://slack.com";
    private API_ENDPOINT = this.BASE_URI + "/api/";
    private AUTH_ENDPOINT = this.BASE_URI + "/oauth/authorize";
    private cache: GoogleAppsScript.Cache.CacheService;
    private option = this.option != null ? this.option : {};

    private _clientId: string;
    private _clientSecret: string;
    private _scriptId: string;
    private _serviceName: string;
    private _tokenUrl: string;
    private _tokenFormat: TokenFormat;
    private _refreshUrl: string;
    private _tokenHeaders: { [inedx: string]: string };
    private _tokenPayloadHandler: { [inedx: string]: string };

    private _params: { [index: string]: string } = {};
    private _callbackFunctionName;
    private _oAuthStorage: SlackStorage;
    private _oAuthLock: SlackLock;

    private _lastError: Error;
    private get OAuthStorage(): SlackStorage {
        if (this._oAuthStorage) return this._oAuthStorage;
        this._oAuthStorage = new SlackStorage("OAuth2", this.cache.getUserCache(), PropertiesService.getUserProperties(), 6);
        return this._oAuthStorage;
    }
    private get OAuthLock(): SlackLock {
        if (this._oAuthLock) return this._oAuthLock;
        this._oAuthLock = new SlackLock();
        return this._oAuthLock;
    }
    private set Token(token: SlackAppsScript.SlackToken) {
        this.OAuthStorage.SetValue("token", token);
    }
    private get Token(): SlackAppsScript.SlackToken {
        return this.OAuthStorage.GetValue("token") as SlackAppsScript.SlackToken;
    }
    constructor(_token: string, _method?: string) {
        this.token = _token;
        if (!(this.token != null)) throw new Error("the token is required");
    }
    urlFetch_(rpcMethod: string, param?: Object, option?: Object): JSON {
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
    authRevoke(test: boolean): JSON {
        let methodUrl = "auth.revoke";
        return this.urlFetch_(methodUrl, { "test": test });
    }
    authTest(): JSON {
        let methodUrl = "auth.test";
        return this.urlFetch_(methodUrl);
    }
    botsInfo(bot: string): JSON {
        let methodUrl = "bots.info";
        return this.urlFetch_(methodUrl, { "bot": bot });
    }
    channelsArchive(channel: string): JSON {
        let methodUrl = "channels.archive";
        return this.urlFetch_(methodUrl, { "channel": channel });
    }
    channelsCreate(name: string): JSON {
        let methodUrl = "channels.create";
        return this.urlFetch_(methodUrl, { "name": name });
    }
    channelsHistory(channel: string, latest?: number, oldest?: number, inclusive?: number, count?: number, unreads?: number): JSON {
        let methodUrl = "channels.history";
        let param = { "channel": channel };
        if (latest != null) { param["latest"] = latest; }
        if (oldest != null) { param["oldest"] = oldest; }
        if (inclusive != null) { param["inclusive"] = inclusive; }
        if (count != null) { param["count"] = count; }
        if (unreads != null) { param["unreads"] = unreads; }
        return this.urlFetch_(methodUrl, param);
    }

    public Refresh() {
        Validate({
            'Client ID': this._clientId,
            'Client Secret': this._clientSecret,
            'Token URL': this._tokenUrl
        });

        this.OAuthLock.UsingUserLock(() => {
            let token = this.Token;
            if (!token.refresh_token) {
                throw new Error('Offline access is required.');
            }
            let payload: { [index: string]: string } = {
                refresh_token: token.refresh_token,
                client_id: this._clientId,
                client_secret: this._clientSecret,
                grant_type: 'refresh_token'
            };
            let newToken = this.FetchToken(payload, this._refreshUrl);
            if (!newToken.refresh_token) {
                newToken.refresh_token = token.refresh_token;
            }
            this.Token = newToken;
            return true;
        })
    }

    private FetchToken(payload: { [index: string]: string }, optUrl: string): SlackAppsScript.SlackToken {
        let url = optUrl || this._tokenUrl;

        let accept = GetTokenFormat_(this._tokenFormat);

        let headers: { [inedx: string]: string } = {
            'Accept': accept
        };
        if (this._tokenHeaders) {
            headers = Extend_(headers, this._tokenHeaders);
        }
        if (this._tokenPayloadHandler) {
            let tokenPayload = this._tokenPayloadHandler(payload);
        }
        let response = UrlFetchApp.fetch(url, {
            method: 'post',
            headers: headers,
            payload: payload,
            muteHttpExceptions: true
        });
        return this.getTokenFromResponse_(response);
    }

    private HasAccess(): boolean {
        return this.OAuthLock.UsingUserLock(() => {
            let token = this.Token;
            if (!token || this.IsExpired(token)) {
                try {
                    if (token && this.CanRefresh(token)) {
                        this.refresh();
                    } else if (this.privateKey_) {
                        this.exchangeJwt_();
                    } else if (this.grantType_) {
                        this.exchangeGrant_();
                    } else {
                        return false;
                    }
                } catch (e) {
                    this._lastError = e;
                    return false;
                }
            }
            return true;
        });
    }
    private IsExpired(token: SlackAppsScript.SlackToken): boolean {
        let expiresIn = token.expires_in || token.expires;
        if (!expiresIn) {
            return false;
        } else {
            let expiresTime = token.granted_time + Number(expiresIn);
            let now = GetTimeInSeconds_(new Date());
            return expiresTime - now < 60;
        }
    }
    private CanRefresh(token: SlackAppsScript.SlackToken) {
        if (!token.refresh_token) return false;
        let expiresIn = token.refresh_token_expires_in;
        if (!expiresIn) {
            return true;
        } else {
            let expiresTime = token.granted_time + Number(expiresIn);
            let now = GetTimeInSeconds_(new Date());
            return expiresTime - now > 60;
        }
    }

    private ParseToken(content: string, tokenFormat: TokenFormat) {
        let token: SlackAppsScript.SlackToken;
        switch (tokenFormat) {
            case TokenFormat.Json:
                token = JSON.parse(content) as SlackAppsScript.SlackToken;
                break;
            case TokenFormat.FormUrlencoded:
                token = content.split('&').reduce((result, pair) => {
                    let parts = pair.split('=');
                    result[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
                    return result;
                }, {}) as SlackAppsScript.SlackToken;
                break;
            default: throw new Error(`Unknown token format: ${tokenFormat}`);
        }
        token.granted_time = GetTimeInSeconds_(new Date());
    }
    private GetAuthorizationUrl(): string {
        Validate({
            'Client ID': this._clientId,
            'Script ID': this._scriptId,
            'Callback function name': this._callbackFunctionName,
            'Authorization base URL': this.AUTH_ENDPOINT
        });
        let redirectUri = GetRedirectUri(this._scriptId);
        let state = eval('Script' + 'App').newStateToken()
            .withMethod(this._callbackFunctionName)
            .withArgument('serviceName', this._serviceName)
            .withTimeout(3600)
            .createToken();
        let params: { [index: string]: string } = {
            client_id: this._clientId,
            response_type: 'code',
            redirect_uri: redirectUri,
            state: state
        };
        params = Extend(params, this._params);
        return BuildUrl(this.AUTH_ENDPOINT, params);
    }
}
function Extend_(destination: { [inedx: string]: string }, source: { [inedx: string]: string }) {
    let keys = Object.keys(source);
    for (let i = 0; i < keys.length; ++i) {
        destination[keys[i]] = source[keys[i]];
    }
    return destination;
}
function GetTokenFormat_(tokenFormat: TokenFormat): string {
    switch (tokenFormat) {
        case TokenFormat.Json:
            return 'application/json';
        case TokenFormat.FormUrlencoded:
            return 'application/x-www-form-urlencoded';
        default: throw new Error(`Unknown token format: ${tokenFormat}`);
    }
}
enum TokenFormat {
    Json,
    FormUrlencoded
} 