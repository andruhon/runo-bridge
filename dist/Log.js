"use strict";
(function (LOGLEV) {
    LOGLEV[LOGLEV["ERR"] = 1] = "ERR";
    LOGLEV[LOGLEV["INF"] = 2] = "INF";
    LOGLEV[LOGLEV["WARN"] = 3] = "WARN";
    LOGLEV[LOGLEV["DEBUG"] = 4] = "DEBUG";
})(exports.LOGLEV || (exports.LOGLEV = {}));
var LOGLEV = exports.LOGLEV;
var Log = (function () {
    function Log(level) {
        if (level === void 0) { level = LOGLEV.INF; }
        this.level = level;
    }
    Log.prototype.err = function (msg) {
        if (this.level >= LOGLEV.ERR)
            console.error(msg);
    };
    Log.prototype.log = function (msg) {
        if (this.level >= LOGLEV.INF)
            console.log(msg);
    };
    Log.prototype.warn = function (msg) {
        if (this.level >= LOGLEV.WARN)
            console.warn(msg);
    };
    Log.prototype.debug = function (msg) {
        if (this.level >= LOGLEV.DEBUG)
            console.log(msg);
    };
    return Log;
}());
exports.Log = Log;
