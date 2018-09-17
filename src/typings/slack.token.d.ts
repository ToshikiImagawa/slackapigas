declare module SlackAppsScript {
    export interface SlackToken {
        granted_time: number;
        expires_in: number;
        expires: number;
        refresh_token: number;
        refresh_token_expires_in: number;
    }
}