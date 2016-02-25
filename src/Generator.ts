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
    let inputs = [];
    let out = "";
    func.inputs.forEach(function(input){
      if (Generator.allowedTypes.indexOf(input.type)<0) {
        console.log(input.type);
        throw Error("unsupported type");
      }
      inputs.push(Generator.mapToCType(input.type)+" "+input.name)
    });
    if (Generator.allowedTypes.indexOf(func.output)<0) {
      console.log(func);
      throw Error("unsupported type");
    }
    return '  extern "C" '+Generator.mapToCType(func.output)+ ' '+func.name + '('+ inputs.join(", ") +');';
  }

  /* TODO: switch to babel or typescript with proper templates otb */

  protected createNanMethod (func:IFunctionDefinition): string {
    let inputs = [];
    let externParams = [];
    let v8ReturnValue;
    let out = "";
    func.inputs.forEach((input, index)=>{
      let inType = Generator.mapToCType(input.type);
      switch (input.type) {
        case "c_int":
        case "bool":
          inputs.push(inType+' '+input.name+' = To<'+inType+'>(info['+index+']).FromJust();');
          break;
        case "*c_char":
          let i  = "Nan::HandleScope scope;"+os.EOL;
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
        v8ReturnValue += "  "+"free(result);";
        break;
      case "void":
        break;
      default:
        console.log(func);
        throw Error("unsupported type");
    }
    out += "NAN_METHOD("+func.name+") {"+os.EOL;
    out += "  "+inputs.join(os.EOL+"  ")+os.EOL;
    out += "  "+Generator.mapToCType(func.output)+" result = "+func.name+"("+externParams.join(", ")+");"+os.EOL;
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
