import * as os from 'os';
import * as fs from 'fs';
import {IInterfaceDefinition, IFunctionDefinition} from './interfaces/IABIInterface';


export class Generator {

  protected static noManglePattern = '#[no_mangle]';
  protected static fnDefPattern = 'pub extern "C" fn ';
  protected static fnSigPattern = "(\\w+)\\s*\\((.*)\\)\\s*(->)?\\s*((\\*\\w*\\s*)?\\w*)";
  protected static allowedTypes = [
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

  protected extern_c_functions = [];
  protected nan_methods = [];
  protected nan_inits = [];

  constructor(protected input: IInterfaceDefinition, protected template: string) {}

  protected createExternDefinition (func:IFunctionDefinition): string {
    let parameters = [];
    let out = "";
    func.parameters.forEach(function(param){
      if (Generator.allowedTypes.indexOf(param.type)<0) {
        console.log(param.type);
        throw Error("unsupported type");
      }
      parameters.push(Generator.mapToCType(param.type)+" "+param.name)
    });
    if (Generator.allowedTypes.indexOf(func.return)<0) {
      console.log(func);
      throw Error("unsupported type");
    }
    return '  extern "C" '+Generator.mapToCType(func.return)+ ' '+func.name + '('+ parameters.join(", ") +');';
  }

  /* TODO: switch to babel or typescript with proper templates otb */

  protected createNanMethod (func:IFunctionDefinition): string {
    let parameters = [];
    let externParams = [];
    let v8ReturnValue;
    let out = "";
    func.parameters.forEach((param, index)=>{
      let inType = Generator.mapToCType(param.type);
      switch (param.type) {
        case "c_int":
        case "bool":
          parameters.push(inType+' '+param.name+' = To<'+inType+'>(info['+index+']).FromJust();');
          break;
        case "*c_char":
          let i  = "Nan::HandleScope scope;"+os.EOL;
              i += "  "+"String::Utf8Value cmd_"+param.name+"(info["+index+"]);"+os.EOL;
              i += "  "+"string s_"+param.name+" = string(*cmd_"+param.name+");"+os.EOL;
              i += "  "+"char *"+param.name+" = new char[s_"+param.name+".length() + 1];"+os.EOL;
              i += "  "+"strcpy("+param.name+", s_"+param.name+".c_str());"+os.EOL;
          parameters.push(i);
          break;
        default:
          console.log(param.type);
          throw Error("unsupported type");
      }
      externParams.push(param.name);
    });
    switch(func.return) {
      case "c_int":
      case "bool":
        v8ReturnValue = "info.GetReturnValue().Set(result);"
        break;
      case "*c_char":
        v8ReturnValue = "info.GetReturnValue().Set(Nan::New<String>(result).ToLocalChecked());"+os.EOL;
        v8ReturnValue += "  "+"free(result);";
        break;
      case "void":
        break;
      default:
        console.log(func);
        throw Error("unsupported type");
    }
    out += "NAN_METHOD("+func.name+") {"+os.EOL;
    out += "  "+parameters.join(os.EOL+"  ")+os.EOL;
    out += "  "+Generator.mapToCType(func.return)+" result = "+func.name+"("+externParams.join(", ")+");"+os.EOL;
    out += "  "+v8ReturnValue+os.EOL;
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
