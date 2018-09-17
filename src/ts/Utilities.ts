/// <reference path="../typings/google-apps-script.utilities.d.ts" />

function Validate(params: { [index: string]: string }) {
    Object.keys(params).forEach(function (name) {
        var value = params[name];
        if (!value) throw Utilities.formatString('%s is required.', name);
    });
}
function Extend(destination: { [index: string]: string }, source: { [index: string]: string }): { [index: string]: string } {
    var keys = Object.keys(source);
    for (var i = 0; i < keys.length; ++i) {
        destination[keys[i]] = source[keys[i]];
    }
    return destination;
}
function BuildUrl(url: string, params: { [index: string]: string }): string {
    var paramString = Object.keys(params).map(function (key) {
        return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
    }).join('&');
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + paramString;
}
function GetTimeInSeconds_(date: Date): number {
    return Math.floor(date.getTime() / 1000);
}