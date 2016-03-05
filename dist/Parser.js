"use strict";
var path = require('path');
var readline = require('readline');
var Log_1 = require('./Log');
var prettyjson = require('prettyjson');
var l = new Log_1.Log();
var Parser = (function () {
    function Parser(source, name, settings) {
        var _this = this;
        this.source = source;
        this.name = name;
        this.settings = {
            noManglePattern: '#[no_mangle]',
            fnDefPattern: 'pub extern "C" fn ',
            fnSigPattern: '(\\w+)\\s*\\((.*)\\)\\s*(->)?\\s*((\\*\\w*\\s*)?\\w*)',
            verbosity: Log_1.LOGLEV.INF
        };
        this.parseInner = function (resolve, reject) {
            var rl = readline.createInterface({
                input: _this.source
            });
            var s = _this.settings;
            var prevMangle = false;
            var results = {
                module_name: path.basename(_this.name),
                functions: []
            };
            rl.on('line', function (line) {
                if (prevMangle) {
                    var fnDef = line.trim().replace(/\s+/g, " ");
                    if (fnDef.startsWith(s.fnDefPattern)) {
                        var fnParsed = _this.parseFunc(fnDef);
                        if (fnParsed) {
                            results.functions.push(fnParsed);
                        }
                    }
                    else {
                        l.err(s.noManglePattern + " is not followed by the line with" + s.fnDefPattern);
                    }
                }
                if (line.trim().startsWith(s.noManglePattern)) {
                    prevMangle = true;
                }
                else {
                    prevMangle = false;
                }
            });
            rl.on('close', function () {
                l.log("Parse result:");
                l.wrapped(results, prettyjson.render);
                resolve(results);
            });
        };
        if (settings)
            Object.assign(this.settings, settings); //mutate settings
        l.level = this.settings.verbosity;
    }
    Parser.prototype.parseFunc = function (fnDef) {
        var fnSig = fnDef.substr(this.settings.fnDefPattern.length);
        var fnSigRegex = new RegExp(this.settings.fnSigPattern, "g");
        var parsed = fnSigRegex.exec(fnSig);
        if (!parsed) {
            l.err("can't parse " + fnSig);
            return;
        }
        var parameters = parsed[2].split(",").map(function (v) {
            var param = v.split(":");
            return { name: param[0].trim(), type: param[1].replace(/(const|mut)*/g, "").replace(/\s*/g, "") };
        });
        if (parsed[4]) {
            var output = parsed[4].replace(/(const|mut)/, "").replace(/\s*/g, "");
        }
        else {
            var output = "void";
        }
        return {
            name: parsed[1],
            parameters: parameters,
            return: output
        };
    };
    Parser.prototype.parse = function () {
        return new Promise(this.parseInner);
    };
    return Parser;
}());
exports.Parser = Parser;
