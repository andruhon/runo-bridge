"use strict";
var os = require('os');
var Generator = (function () {
    function Generator(input, template) {
        this.input = input;
        this.template = template;
        this.extern_c_functions = [];
        this.nan_methods = [];
        this.nan_inits = [];
    }
    Generator.prototype.createExternDefinition = function (func) {
        var inputs = [];
        var out = "";
        func.inputs.forEach(function (input) {
            if (Generator.allowedTypes.indexOf(input.type) < 0) {
                console.log(input.type);
                throw Error("unsupported type");
            }
            inputs.push(Generator.mapToCType(input.type) + " " + input.name);
        });
        if (Generator.allowedTypes.indexOf(func.output) < 0) {
            console.log(func);
            throw Error("unsupported type");
        }
        return '  extern "C" ' + Generator.mapToCType(func.output) + ' ' + func.name + '(' + inputs.join(", ") + ');';
    };
    /* TODO: switch to babel or typescript with proper templates otb */
    Generator.prototype.createNanMethod = function (func) {
        var inputs = [];
        var externParams = [];
        var v8ReturnValue;
        var out = "";
        func.inputs.forEach(function (input, index) {
            var inType = Generator.mapToCType(input.type);
            switch (input.type) {
                case "c_int":
                case "bool":
                    inputs.push(inType + ' ' + input.name + ' = To<' + inType + '>(info[' + index + ']).FromJust();');
                    break;
                case "*c_char":
                    var i = "Nan::HandleScope scope;" + os.EOL;
                    i += "  " + "String::Utf8Value cmd_" + input.name + "(info[" + index + "]);" + os.EOL;
                    i += "  " + "string s_" + input.name + " = string(*cmd_" + input.name + ");" + os.EOL;
                    i += "  " + "char *" + input.name + " = new char[s_" + input.name + ".length() + 1];" + os.EOL;
                    i += "  " + "strcpy(" + input.name + ", s_" + input.name + ".c_str());" + os.EOL;
                    inputs.push(i);
                    break;
                default:
                    console.log(input.type);
                    throw Error("unsupported type");
            }
            externParams.push(input.name);
        });
        switch (func.output) {
            case "c_int":
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
                console.log(func);
                throw Error("unsupported type");
        }
        out += "NAN_METHOD(" + func.name + ") {" + os.EOL;
        out += "  " + inputs.join(os.EOL + "  ") + os.EOL;
        out += "  " + Generator.mapToCType(func.output) + " result = " + func.name + "(" + externParams.join(", ") + ");" + os.EOL;
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
        "bool",
        "void",
        /* pointers */
        "*c_char",
    ];
    return Generator;
}());
exports.Generator = Generator;
