/// <reference path="../typings/google-apps-script.lock.d.ts" />
class SlackLock {
    private _userLock: GoogleAppsScript.Lock.Lock;
    private _timeoutInMillis: GoogleAppsScript.Integer;
    constructor(timeoutInMillis: GoogleAppsScript.Integer = 30000) {
        this._userLock = LockService.getUserLock();
        this._timeoutInMillis = timeoutInMillis;
    }
    public UsingUserLock(func: () => boolean): boolean {
        if (!this._userLock.tryLock(this._timeoutInMillis)) return false;
        let result = func();
        this._userLock.releaseLock();
        return result;
    }
}
