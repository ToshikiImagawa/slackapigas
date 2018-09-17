/// <reference path="../typings/google-apps-script.script.d.ts" />
/// <reference path="../typings/google-apps-script.url-fetch.d.ts" />
/// <reference path="../typings/google-apps-script.cache.d.ts" />
/// <reference path="../typings/google-apps-script.properties.d.ts" />
/// <reference path="../typings/gas-library.d.ts" />

class SlackStorage {
    private _prefix: string;
    private _memory: Object = {};
    private _properties: GoogleAppsScript.Properties.Properties;
    private _cache: GoogleAppsScript.Cache.Cache;
    private _expirationInSeconds: number = 21600;

    constructor(prefix: string, cache: GoogleAppsScript.Cache.Cache, properties: GoogleAppsScript.Properties.Properties);
    constructor(prefix: string, cache: GoogleAppsScript.Cache.Cache, properties: GoogleAppsScript.Properties.Properties, expirationInHours: number);
    constructor(prefix: string, cache: GoogleAppsScript.Cache.Cache, properties: GoogleAppsScript.Properties.Properties, expirationInHours?: number) {
        this._prefix = prefix;
        this._cache = cache;
        this._properties = properties;
        if (expirationInHours) this._expirationInSeconds = expirationInHours * 3600;
    }
    public SetValue(key: string, value: Object) {
        let prefixedKey = this.GetPrefixedKey(key);
        let json = JSON.stringify(value);
        if (this._properties) this._properties.setProperty(prefixedKey, json);
        if (this._cache) this._cache.put(this._prefix, json, this._expirationInSeconds);
        this._memory[key] = value;
    }
    public GetValue(key: string): Object {
        if (this._memory[key]) return this._memory[key];
        let prefixedKey = this.GetPrefixedKey(key);
        let json: string;
        let value: Object = {};
        if (this._cache && this._cache.get(prefixedKey)) {
            json = this._cache.get(prefixedKey);
            value = JSON.parse(json);
            this._memory[key] = value;
            return value;
        }
        if (this._properties && this._properties.getProperty(prefixedKey)) {
            json = this._cache.get(prefixedKey);
            if (this._cache) this._cache.put(this._prefix, json, this._expirationInSeconds);
            value = JSON.parse(json);
            this._memory[key] = value;
            return value;
        }
        return null;
    }
    public RemoveValue(key: string) {
        let prefixedKey = this.GetPrefixedKey(key);
        if (this._properties) this._properties.deleteProperty(prefixedKey);
        if (this._cache) this._cache.remove(this._prefix);
        delete this._memory[key];
    }
    private GetPrefixedKey(key: string) {
        if (key) return `${this._prefix}_${key}`;
        return this._prefix;
    }
}