var fs = require("fs");
var path = require("path");
var os = require("os");
var input = require("./rust-input");


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
  "c_double", //JS number
  "c_int", //JS number
  "boolean", // JS boolean

  /* pointers */
  // "pointer_c_char", //JS String
  // "pointer_c_double", //JS number array
  // "pointer_c_int_number", //JS number array
  // "pointer_pointer_c_char", //JS string array
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

var template = fs.readFileSync(path.join(__dirname,"templates/addon.cc"),"utf8");

var extern_c_functions = [];
var nan_methods = [];
var nan_inits = [];

function unsupported(type){
  throw new Error(type+" is not a supported type, only "+(allowedTypes.join(", "))+" supported");
}

function createExternDefinition (func) {
  var inputs = [];
  var out = "";
  func.inputs.forEach(function(input){
    if (allowedTypes.indexOf(input.type)<0) {
      unsupported(input.type);
    }
    inputs.push(input.type.replace("c_","")+" "+input.name)
  });
  switch(func.output) {
    case "c_int":
      return 'extern "C" int ' + func.name + '('+ inputs.join(", ") +');'
      break;
    default:
      unsupported(func.output);
  }
}

function createNanMethod (func) {
  var inputs = [];
  var externParams = [];
  var v8ReturnValue;
  var returnType;
  var out = "";
  func.inputs.forEach(function(input, index){
    switch (input.type) {
      case "c_int":
        //TODO: handle unexpected values
        inputs.push('int '+input.name+' = To<int>(info['+index+']).FromJust();')
        externParams.push(input.name);
        break;
      default:
        unsupported(input.type);
    }
  });
  switch(func.output) {
    case "c_int":
      v8ReturnValue = "info.GetReturnValue().Set(result);"
      returnType = "int";
      break;
    default:
      unsupported(func.output);
  }
  out += "NAN_METHOD("+func.name+") {"+os.EOL;
  out += "  "+inputs.join(os.EOL+"  ")+os.EOL;
  out += "  "+returnType+" result = "+func.name+"("+externParams.join(", ")+");"+os.EOL;
  out += "  "+v8ReturnValue+os.EOL;
  out += "}"
  return out;
}

function createNanInit (func) {
  var out = "";
  out += 'Nan::Set(target, New("'+func.name+'").ToLocalChecked(),';
  out += ' Nan::GetFunction(New<FunctionTemplate>('+func.name+')).ToLocalChecked());';
  return out;
}

input.functions.forEach(function(func){
  extern_c_functions.push(createExternDefinition(func));
  nan_methods.push(createNanMethod(func));
  nan_inits.push(createNanInit(func));
});

var output = template.replace("{{extern_c_functions}}",extern_c_functions.join(os.EOL))
  .replace("{{nan_methods}}",nan_methods.join(os.EOL))
  .replace("{{nan_inits}}",nan_inits.join(os.EOL));

fs.writeFileSync("src/addon.cc", output);
console.log("addon C++ template preparation successfully done.");
