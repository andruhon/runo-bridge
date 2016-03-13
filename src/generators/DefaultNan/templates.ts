import {IInterfaceDefinition, IFunctionDefinition, IFunctionParemeterDefinition} from '../../interfaces/IABIInterface';
import {Generator, l} from '../../Generator';

export function externCFunc (allowedTypes: string[],func: IFunctionDefinition) {
  
  let parameters = [];
  func.parameters.forEach(function(param){
    if (allowedTypes.indexOf(param.type)<0) {
      l.err(param.type+" param "+param.type);
      throw Error(Generator.UNSUPPORTED_TYPE);
    }
    parameters.push(Generator.mapToCType(param.type)+" "+param.name)
  });
  if (allowedTypes.indexOf(func.return)<0) {
    l.err(func.name+" returns "+func.return);
    throw Error(Generator.UNSUPPORTED_TYPE);
  }

return `
  extern "C" ${Generator.mapToCType(func.return)} ${func.name}(${parameters.join(", ")});`
}

export function funcParameterDefault (index: number, param: IFunctionParemeterDefinition) {
let inType = Generator.mapToCType(param.type);
if (param.type=="c_float") {
  l.warn(Generator.WARN_FLOAT);
  inType = "double";
}
return `
  ${inType} ${param.name} = To<${inType}>(info[${index}]).FromJust();`
}

export function funcParameterCString (index: number, param: IFunctionParemeterDefinition) {
return `
  Nan::HandleScope scope;
  String::Utf8Value cmd_${param.name}(info[${index}]);
  string s_${param.name} = string(*cmd_${param.name});
  char *${param.name} = (char*) malloc (s_${param.name}.length() + 1);
  strcpy(${param.name}, s_${param.name}.c_str());`
}

export function dealloc (param: IFunctionParemeterDefinition) {
return `
  free(${param.name});`
}

export function returnValueDefault () {
return `
  info.GetReturnValue().Set(result);`
}

export function returnValueCString () {
return `
  info.GetReturnValue().Set(Nan::New<String>(result).ToLocalChecked());
  free(result);`
}

export function init (func: IFunctionDefinition) {
return `
  Nan::Set(
    target, New("${func.name}").ToLocalChecked(),
    Nan::GetFunction(New<FunctionTemplate>(${func.name})).ToLocalChecked()
  );`
}

export function nanMethod(
  func: IFunctionDefinition,
  parameters: string[],
  externParams: string[],
  deallocations: string[],
  v8ReturnValue: string
) {
return `
NAN_METHOD(${func.name}) {`+
  `${parameters.join("")}
  ${Generator.mapToCType(func.return)} result = ${func.name}(${externParams.join(", ")});`+
  `${v8ReturnValue}`+
  `${deallocations.join('')}
}`;
}
