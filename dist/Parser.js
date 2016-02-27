"use strict";
var path = require('path');
var readline = require('readline');
var Parser = (function () {
    function Parser(source, name, settings) {
        var _this = this;
        this.source = source;
        this.name = name;
        this.settings = {
            noManglePattern: '#[no_mangle]',
            fnDefPattern: 'pub extern "C" fn ',
            fnSigPattern: '(\\w+)\\s*\\((.*)\\)\\s*(->)?\\s*((\\*\\w*\\s*)?\\w*)'
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
                        console.error(s.noManglePattern + " is not followed by the line with" + s.fnDefPattern);
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
                console.log("found following extern functions:");
                console.log(JSON.stringify(results, null, "  "));
                resolve(results);
            });
        };
        if (settings)
            Object.assign(this.settings, settings); //mutate settings
    }
    Parser.prototype.parseFunc = function (fnDef) {
        var fnSig = fnDef.substr(this.settings.fnDefPattern.length);
        var fnSigRegex = new RegExp(this.settings.fnSigPattern, "g");
        console.log(fnSig);
        var parsed = fnSigRegex.exec(fnSig);
        if (!parsed) {
            console.error("can't parse " + fnSig);
            return;
        }
        var inputs = parsed[2].split(",").map(function (v) {
            var input = v.split(":");
            console.log(input[1].replace(/(const|mut)/, "").replace(/\s*/g, ""));
            return { name: input[0].trim(), type: input[1].replace(/(const|mut)*/g, "").replace(/\s*/g, "") };
        });
        if (parsed[4]) {
            var output = parsed[4].replace(/(const|mut)/, "").replace(/\s*/g, "");
        }
        else {
            console.log(parsed);
            var output = "void";
        }
        return {
            name: parsed[1],
            inputs: inputs,
            output: output
        };
    };
    Parser.prototype.parse = function () {
        return new Promise(this.parseInner);
    };
    return Parser;
}());
exports.Parser = Parser;
