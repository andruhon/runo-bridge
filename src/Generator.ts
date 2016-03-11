import * as os from 'os';
import * as fs from 'fs';
import {Log, LOGLEV} from './Log';

import {IInterfaceDefinition, IFunctionDefinition} from './interfaces/IABIInterface';

const l = new Log(LOGLEV.ERR);

const UNSUPPORTED_TYPE = "unsupported type";
const WARN_FLOAT = "v8 alwayse use c_double internally, c_float might lead to precision loose";

export class Generator {

  protected static noManglePattern = '#[no_mangle]';
  protected static fnDefPattern = 'pub extern "C" fn ';
  protected static fnSigPattern = "(\\w+)\\s*\\((.*)\\)\\s*(->)?\\s*((\\*\\w*\\s*)?\\w*)";
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
  protected nan_methods = [];
  protected nan_inits = [];

  constructor(protected input: IInterfaceDefinition, protected template: string) {}

  protected createExternDefinition (func:IFunctionDefinition): string {
    let parameters = [];
    let out = "";
    func.parameters.forEach(function(param){
      if (Generator.allowedTypes.indexOf(param.type)<0) {
        l.err(param.type+" param "+param.type);
        throw Error(UNSUPPORTED_TYPE);
      }
      parameters.push(Generator.mapToCType(param.type)+" "+param.name)
    });
    if (Generator.allowedTypes.indexOf(func.return)<0) {
      l.err(func.name+" returns "+func.return);
      throw Error(UNSUPPORTED_TYPE);
    }
    return '  extern "C" '+Generator.mapToCType(func.return)+ ' '+func.name + '('+ parameters.join(", ") +');';
  }

  /* TODO: switch to babel or typescript with proper templates otb */

  protected createNanMethod (func:IFunctionDefinition): string {
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
            l.warn(WARN_FLOAT);
            inType = "double";
          }
          parameters.push(inType+' '+param.name+' = To<'+inType+'>(info['+index+']).FromJust();');
          break;
        case "*c_char":
          let i  = "Nan::HandleScope scope;"+os.EOL;
              i += "  "+"String::Utf8Value cmd_"+param.name+"(info["+index+"]);"+os.EOL;
              i += "  "+"string s_"+param.name+" = string(*cmd_"+param.name+");"+os.EOL;
              i += "  "+"char *"+param.name+" = (char*) malloc (s_"+param.name+".length() + 1);"+os.EOL;
              i += "  "+"strcpy("+param.name+", s_"+param.name+".c_str());"+os.EOL;
          parameters.push(i);
          deallocations.push("  "+"free("+param.name+");");
          break;
        default:
          l.err(param.name + " param "+ param.type);
          throw Error(UNSUPPORTED_TYPE);
      }
      externParams.push(param.name);
    });
    switch(func.return) {
      case "c_int":
      case "c_double":
      case "c_float":
      case "bool":
        v8ReturnValue =  "  "+"info.GetReturnValue().Set(result);";
        break;
      case "*c_char":
        v8ReturnValue =  "  "+"info.GetReturnValue().Set(Nan::New<String>(result).ToLocalChecked());"+os.EOL;
        v8ReturnValue += "  "+"free(result);";
        break;
      case "void":
        break;
      default:
        l.err(func.name+" returns "+func.return);
        throw Error(UNSUPPORTED_TYPE);
    }
    out += "NAN_METHOD("+func.name+") {"+os.EOL;
    out += "  "+parameters.join(os.EOL+"  ")+os.EOL;
    out += "  "+Generator.mapToCType(func.return)+" result = "+func.name+"("+externParams.join(", ")+");"+os.EOL;
    out += v8ReturnValue+os.EOL;
    out += deallocations.join(os.EOL)+os.EOL;
    out += "}"
    return out;
  }

  protected createNanInit (func: IFunctionDefinition): string {
    let out = "";
    out += '  Nan::Set(target, New("'+func.name+'").ToLocalChecked(),';
    out += '    Nan::GetFunction(New<FunctionTemplate>('+func.name+')).ToLocalChecked());';
    return out;
  }

  public generate (): string {
    this.input.functions.forEach((func)=>{
      this.extern_c_functions.push(this.createExternDefinition(func));
      this.nan_methods.push(this.createNanMethod(func));
      this.nan_inits.push(this.createNanInit(func));
    });

    let output = this.template.replace("{{extern_c_functions}}",this.extern_c_functions.join(os.EOL))
      .replace("{{nan_methods}}",this.nan_methods.join(os.EOL))
      .replace("{{nan_inits}}",this.nan_inits.join(os.EOL));

    return output;
  };

  public static mapToCType(type: string): string {
    switch (type) {
      case "*c_char":
        return "char *";
      default:
        return type.replace("c_","");
    }
  }

}
