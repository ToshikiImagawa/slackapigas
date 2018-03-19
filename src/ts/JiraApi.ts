/// <reference path="../typings/google-apps-script.script.d.ts" />
/// <reference path="../typings/google-apps-script.url-fetch.d.ts" />
/// <reference path="../typings/google-apps-script.cache.d.ts" />
/// <reference path="../typings/google-apps-script.properties.d.ts" />
/// <reference path="../typings/gas-library.d.ts" />

function Create(jira_hostname:string, username: string,password: string){
    return new JiraApi(jira_hostname, username, password);
}

class JiraApi {
    jira_hostname : string;
    username : string;
    password : string;
    constructor(_jira_hostname:string, _username: string,_password: string) {
        this.jira_hostname = _jira_hostname;
        this.username = _username;
        this.password = _password;
        if (!(this.jira_hostname != null)) {throw new Error("the jira hostname is required");}
    }
    Authentication(option: Object, response: GoogleAppsScript.URL_Fetch.HTTPResponse) {
        const options = {
            uri: `https://${this.jira_hostname}/rest/auth/1/session`,
            headers: {
                "Content-Type": "application/json",
            },
            body: {
                username: this.username,
                password: this.password,
            },
            method: "POST",
            json: true
        };
        return JSON.parse(UrlFetchApp.fetch(`https://${this.jira_hostname}/rest/auth/1/session`, options).getContentText());
    }
}
