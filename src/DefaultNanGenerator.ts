import * as fs from 'fs';
import {Log, LOGLEV} from './Log';

import {IInterfaceDefinition, IFunctionDefinition} from './interfaces/IABIInterface';
import {Generator} from './Generator';

export const l = new Log(LOGLEV.ERR);

export class DefaultNanGenerator extends Generator {

  protected static allowedTypes = [
    /* some primitives from Rust's libc */
    //"c_double", //JS number
    "c_int", //JS number
    "c_float", //JS float
    "c_double", //JS float
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

  protected extern_c_functions = [];
  protected methods = [];
  protected inits = [];

  constructor(protected input: IInterfaceDefinition, protected template: string) {
    super(input, template);
  }

  protected createExternDefinition (func:IFunctionDefinition): string {
    let parameters = [];
    let out = "";
    func.parameters.forEach(function(param){
      if (DefaultNanGenerator.allowedTypes.indexOf(param.type)<0) {
        l.err(param.type+" param "+param.type);
        throw Error(Generator.UNSUPPORTED_TYPE);
      }
      parameters.push(Generator.mapToCType(param.type)+" "+param.name)
    });
    if (DefaultNanGenerator.allowedTypes.indexOf(func.return)<0) {
      l.err(func.name+" returns "+func.return);
      throw Error(Generator.UNSUPPORTED_TYPE);
    }

/* TEMPLATE */
return `
  extern "C" ${Generator.mapToCType(func.return)} ${func.name}(${parameters.join(", ")});`;

  }

  /* TODO: switch to babel or typescript with proper templates otb */

  protected createMethod (func:IFunctionDefinition): string {
    let parameters = [];
    let externParams = [];
    let deallocations = [];
    let v8ReturnValue;
    let out = "";
    func.parameters.forEach((param, index)=>{
      let inType = Generator.mapToCType(param.type);
      switch (param.type) {
        case "c_int":
        case "c_double":
        case "c_float":
        case "bool":
          if (param.type=="c_float") {
            l.warn(Generator.WARN_FLOAT);
            inType = "double";
          }

//TEMPLATE
parameters.push(`
  ${inType} ${param.name} = To<${inType}>(info[${index}]).FromJust();`);

          break;
        case "*c_char":

//TEMPLATE
parameters.push(`
  Nan::HandleScope scope;
  String::Utf8Value cmd_${param.name}(info[${index}]);
  string s_${param.name} = string(*cmd_${param.name});
  char *${param.name} = (char*) malloc (s_${param.name}.length() + 1);
  strcpy(${param.name}, s_${param.name}.c_str());`);

//TEMPLATE
deallocations.push(`
  free(${param.name});`);

          break;
        default:
          l.err(param.name + " param "+ param.type);
          throw Error(Generator.UNSUPPORTED_TYPE);
      }
      externParams.push(param.name);
    });
    switch(func.return) {
      case "c_int":
      case "c_double":
      case "c_float":
      case "bool":

//TEMPLATE
v8ReturnValue =  `
  info.GetReturnValue().Set(result);`;

        break;
      case "*c_char":

//TEMPLATE
v8ReturnValue = `
  info.GetReturnValue().Set(Nan::New<String>(result).ToLocalChecked());
  free(result);`;

        break;
      case "void":
        break;
      default:
        l.err(func.name+" returns "+func.return);
        throw Error(Generator.UNSUPPORTED_TYPE);
    }

//TEMPLATE
return `
NAN_METHOD(${func.name}) {`+
  `${parameters.join("")}`+
  `${Generator.mapToCType(func.return)}
  result = ${func.name}(${externParams.join(", ")});`+
  `${v8ReturnValue}`+
  `${deallocations.join('')}
}
`;

  }

  protected createInit (func: IFunctionDefinition): string {

//TEMPLATE
return `
  Nan::Set(
    target, New("${func.name}").ToLocalChecked(),
    Nan::GetFunction(New<FunctionTemplate>(${func.name})).ToLocalChecked()
  );`;

  }

  public generate (): string {
    this.input.functions.forEach((func)=>{
      this.extern_c_functions.push(this.createExternDefinition(func));
      this.methods.push(this.createMethod(func));
      this.inits.push(this.createInit(func));
    });

    let output = this.template.replace("${extern_c_functions}",this.extern_c_functions.join(''))
      .replace("${methods}",this.methods.join(''))
      .replace("${inits}",this.inits.join(''));
    return output;
  };


}
