"use strict";
var os = require('os');
var UNSUPPORTED_TYPE = "unsupported type";
var WARN_FLOAT = "v8 alwayse use c_double internally, c_float might lead to precision loose";
var Generator = (function () {
    function Generator(input, template) {
        this.input = input;
        this.template = template;
        this.extern_c_functions = [];
        this.nan_methods = [];
        this.nan_inits = [];
    }
    Generator.prototype.createExternDefinition = function (func) {
        var parameters = [];
        var out = "";
        func.parameters.forEach(function (param) {
            if (Generator.allowedTypes.indexOf(param.type) < 0) {
                console.error(param.type);
                throw Error(UNSUPPORTED_TYPE);
            }
            parameters.push(Generator.mapToCType(param.type) + " " + param.name);
        });
        if (Generator.allowedTypes.indexOf(func.return) < 0) {
            console.error(func);
            throw Error(UNSUPPORTED_TYPE);
        }
        return '  extern "C" ' + Generator.mapToCType(func.return) + ' ' + func.name + '(' + parameters.join(", ") + ');';
    };
    /* TODO: switch to babel or typescript with proper templates otb */
    Generator.prototype.createNanMethod = function (func) {
        var parameters = [];
        var externParams = [];
        var v8ReturnValue;
        var out = "";
        func.parameters.forEach(function (param, index) {
            var inType = Generator.mapToCType(param.type);
            switch (param.type) {
                case "c_int":
                case "c_double":
                case "c_float":
                case "bool":
                    if (param.type == "c_float") {
                        console.warn(WARN_FLOAT);
                        inType = "double";
                    }
                    parameters.push(inType + ' ' + param.name + ' = To<' + inType + '>(info[' + index + ']).FromJust();');
                    break;
                case "*c_char":
                    var i = "Nan::HandleScope scope;" + os.EOL;
                    i += "  " + "String::Utf8Value cmd_" + param.name + "(info[" + index + "]);" + os.EOL;
                    i += "  " + "string s_" + param.name + " = string(*cmd_" + param.name + ");" + os.EOL;
                    i += "  " + "char *" + param.name + " = new char[s_" + param.name + ".length() + 1];" + os.EOL;
                    i += "  " + "strcpy(" + param.name + ", s_" + param.name + ".c_str());" + os.EOL;
                    parameters.push(i);
                    break;
                default:
                    console.error(param.type);
                    throw Error(UNSUPPORTED_TYPE);
            }
            externParams.push(param.name);
        });
        switch (func.return) {
            case "c_int":
            case "c_double":
            case "c_float":
            case "bool":
                v8ReturnValue = "info.GetReturnValue().Set(result);";
                break;
            case "*c_char":
                v8ReturnValue = "info.GetReturnValue().Set(Nan::New<String>(result).ToLocalChecked());" + os.EOL;
                v8ReturnValue += "  " + "free(result);";
                break;
            case "void":
                break;
            default:
                console.error(func);
                throw Error(UNSUPPORTED_TYPE);
        }
        out += "NAN_METHOD(" + func.name + ") {" + os.EOL;
        out += "  " + parameters.join(os.EOL + "  ") + os.EOL;
        out += "  " + Generator.mapToCType(func.return) + " result = " + func.name + "(" + externParams.join(", ") + ");" + os.EOL;
        out += "  " + v8ReturnValue + os.EOL;
        out += "}";
        return out;
    };
    Generator.prototype.createNanInit = function (func) {
        var out = "";
        out += '  Nan::Set(target, New("' + func.name + '").ToLocalChecked(),';
        out += '    Nan::GetFunction(New<FunctionTemplate>(' + func.name + ')).ToLocalChecked());';
        return out;
    };
    Generator.prototype.generate = function () {
        var _this = this;
        this.input.functions.forEach(function (func) {
            _this.extern_c_functions.push(_this.createExternDefinition(func));
            _this.nan_methods.push(_this.createNanMethod(func));
            _this.nan_inits.push(_this.createNanInit(func));
        });
        var output = this.template.replace("{{extern_c_functions}}", this.extern_c_functions.join(os.EOL))
            .replace("{{nan_methods}}", this.nan_methods.join(os.EOL))
            .replace("{{nan_inits}}", this.nan_inits.join(os.EOL));
        return output;
    };
    ;
    Generator.mapToCType = function (type) {
        switch (type) {
            case "*c_char":
                return "char *";
            default:
                return type.replace("c_", "");
        }
    };
    Generator.noManglePattern = '#[no_mangle]';
    Generator.fnDefPattern = 'pub extern "C" fn ';
    Generator.fnSigPattern = "(\\w+)\\s*\\((.*)\\)\\s*(->)?\\s*((\\*\\w*\\s*)?\\w*)";
    Generator.allowedTypes = [
        /* some primitives from Rust's libc */
        //"c_double", //JS number
        "c_int",
        "c_float",
        "c_double",
        "bool",
        "void",
        /* pointers */
        "*c_char",
    ];
    return Generator;
}());
exports.Generator = Generator;
