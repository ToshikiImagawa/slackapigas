/// <reference path="./underscore.d.ts" />

declare var Underscore: UnderscoreLibrary.IEach;

declare module UnderscoreLibrary{
    interface IEach{
        _each(obj:Object,iterator:Iterator,context?:any):Object;
        _any(obj:Object,iterator:Iterator, context?: any): boolean;
        _map(obj:Object,iterator:Iterator, context?: any): Object;
        _randomString(max: number): string;
        _find(obj:Object, iterator:Iterator, context?: any):Object;
    }
    interface Iterator{

    }
}
