import * as fs from 'fs';

import {IInterfaceDefinition, IFunctionDefinition} from '../../interfaces/IABIInterface';
import {Generator, l} from '../../Generator';
import * as t from './templates';
import {addonTemplate} from './addonTemplate';

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

  constructor(protected input: IInterfaceDefinition) {
    super(input);
  }

  protected createExternDefinition (func:IFunctionDefinition): string {
    return t.externCFunc(DefaultNanGenerator.allowedTypes, func);
  }

  //TODO: check reserved words such as callback, argv and result
  protected createMethod (func:IFunctionDefinition): string {
    let parameters = [];
    let externParams = [];
    let deallocations = [];
    let v8ReturnValue;
    func.parameters.forEach((param, index)=>{

      switch (param.type) {
        case "c_int":
        case "c_double":
        case "c_float":
        case "bool":
          parameters.push(t.funcParameterDefault(index,param));
          break;
        case "*c_char":
          parameters.push(t.funcParameterCString(index,param));
          deallocations.push(t.dealloc(param));
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
        v8ReturnValue =  t.returnValueDefault();
        break;
      case "*c_char":
        v8ReturnValue = t.returnValueCString();
        break;
      case "void":
        break;
      default:
        l.err(func.name+" returns "+func.return);
        throw Error(Generator.UNSUPPORTED_TYPE);
    }

    return t.nanMethod(func, parameters, externParams, deallocations, v8ReturnValue);
  }

  protected createInit (func: IFunctionDefinition): string {
    return t.init(func);
  }

  public generate (): string {
    this.input.functions.forEach((func)=>{
      this.extern_c_functions.push(this.createExternDefinition(func));
      this.methods.push(this.createMethod(func));
      this.inits.push(this.createInit(func));
    });

    return addonTemplate(this.extern_c_functions.join(''), this.methods.join(''), this.inits.join(''));
  };

}
