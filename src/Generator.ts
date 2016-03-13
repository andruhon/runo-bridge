import {IInterfaceDefinition, IFunctionDefinition} from './interfaces/IABIInterface';
import {Log, LOGLEV} from './Log';

export const l = new Log(LOGLEV.ERR);

export abstract class Generator {

  public static UNSUPPORTED_TYPE = "unsupported type";
  public static WARN_FLOAT = "v8 alwayse use c_double internally, c_float might lead to precision loose";

  protected static noManglePattern = '#[no_mangle]';
  protected static fnDefPattern = 'pub extern "C" fn ';
  protected static fnSigPattern = "(\\w+)\\s*\\((.*)\\)\\s*(->)?\\s*((\\*\\w*\\s*)?\\w*)";

  constructor(protected input: IInterfaceDefinition) {}

  abstract generate(): string;

  public static mapToCType(type: string): string {
    switch (type) {
      case "*c_char":
        return "char *";
      default:
        return type.replace("c_","");
    }
  }

}
