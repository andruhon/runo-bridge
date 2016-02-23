var fs = require("fs");
var os = require("os");

console.log("preparing addon С++ template");
/**
 * Rust code to be parsed somehow to find [#no_mangle] extern "C" functions
 *
 */

/**
 * Expect these types be allowed
 */
var allowedTypes = [
  /* some primitives from Rust's libc */
  //"c_double", //JS number
  "c_int", //JS number
  "bool", // JS boolean
  "void",

  /* pointers */
  "*c_char", //JS String
  // "*c_double", //JS number array
  // "*int_number", //JS number array
  // "**c_char", //JS string array
  //
  // /**
  //   * struct with combination of things above
  //   * (code is parsed, so we know member names and will treat it as a JS object)
  //   */
  // "struct" //JS object
];

//MVP to pass primitives using JS config as inputs
//MDP primitives pointers and structs
//Release everything from above + parse rust entry point code

var extern_c_functions = [];
var nan_methods = [];
var nan_inits = [];

function mapToCType(type) {
  switch (type) {
    case "*c_char":
      return "char *";
      break;
    default:
      return type.replace("c_","");
  }
}

function createExternDefinition (func) {
  var inputs = [];
  var out = "";
  func.inputs.forEach(function(input){
    if (allowedTypes.indexOf(input.type)<0) {
      console.log(input.type);
      throw Error("unsupported type");
    }
    inputs.push(mapToCType(input.type)+" "+input.name)
  });
  if (allowedTypes.indexOf(func.output)<0) {
    console.log(func);
    throw Error("unsupported type");
  }
  return '  extern "C" '+mapToCType(func.output)+ ' '+func.name + '('+ inputs.join(", ") +');';
}

/* TODO: switch to babel or typescript with proper templates otb */

function createNanMethod (func) {
  var inputs = [];
  var externParams = [];
  var v8ReturnValue;
  var out = "";
  func.inputs.forEach(function(input, index){
    var inType = mapToCType(input.type);
    switch (input.type) {
      case "c_int":
      case "bool":
        inputs.push(inType+' '+input.name+' = To<'+inType+'>(info['+index+']).FromJust();');
        break;
      case "*c_char":
        var i  = "Nan::HandleScope scope;"+os.EOL;
            i += "  "+"String::Utf8Value cmd_"+input.name+"(info["+index+"]);"+os.EOL;
            i += "  "+"string s_"+input.name+" = string(*cmd_"+input.name+");"+os.EOL;
            i += "  "+"char *"+input.name+" = new char[s_"+input.name+".length() + 1];"+os.EOL;
            i += "  "+"strcpy("+input.name+", s_"+input.name+".c_str());"+os.EOL;
        inputs.push(i);
        break;
      default:
        console.log(input.type);
        throw Error("unsupported type");
    }
    externParams.push(input.name);
  });
  switch(func.output) {
    case "c_int":
    case "bool":
      v8ReturnValue = "info.GetReturnValue().Set(result);"
      break;
    case "*c_char":
      v8ReturnValue = "info.GetReturnValue().Set(Nan::New<String>(result).ToLocalChecked());"+os.EOL;
      v8ReturnValue += "  "+"rs_drop(result);";
      break;
    case "void":
      break;
    default:
      console.log(func);
      throw Error("unsupported type");
  }
  out += "NAN_METHOD("+func.name+") {"+os.EOL;
  out += "  "+inputs.join(os.EOL+"  ")+os.EOL;
  out += "  "+mapToCType(func.output)+" result = "+func.name+"("+externParams.join(", ")+");"+os.EOL;
  out += "  "+v8ReturnValue+os.EOL;
  out += "}"
  return out;
}

function createNanInit (func) {
  var out = "";
  out += '  Nan::Set(target, New("'+func.name+'").ToLocalChecked(),';
  out += '    Nan::GetFunction(New<FunctionTemplate>('+func.name+')).ToLocalChecked());';
  return out;
}

module.exports = function(template, outputPath, functions) {
  functions.functions.forEach(function(func){
    extern_c_functions.push(createExternDefinition(func));
    nan_methods.push(createNanMethod(func));
    nan_inits.push(createNanInit(func));
  });

  var output = template.replace("{{extern_c_functions}}",extern_c_functions.join(os.EOL))
    .replace("{{nan_methods}}",nan_methods.join(os.EOL))
    .replace("{{nan_inits}}",nan_inits.join(os.EOL));

  fs.writeFileSync(outputPath, output);
  console.log("addon C++ template preparation successfully done.");
};