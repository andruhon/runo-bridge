import {IInterfaceDefinition, IFunctionDefinition, IFunctionParemeterDefinition} from '../../interfaces/IABIInterface';
import {Generator, l} from '../../Generator';
import * as os from 'os';

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

function v8asyncOutput(returnType: string){
  switch (returnType) {
    case "c_int":
    case "c_double":
    case "c_float":
    case "bool":
      return "Nan::New(result)";
    case "*c_char":
    default:
      return "Nan::New(result).ToLocalChecked()";
  }
}

function asyncWorker(
  func: IFunctionDefinition
) {
  let workerParams = func.parameters.map((p)=>{
    return {name: p.name, type: Generator.mapToCType(p.type)};
  });
return `
class ${func.name}Worker : public AsyncWorker {
 public:
  ${func.name}Worker(Callback *callback, ${workerParams.map((p)=>`${p.type} ${p.name}`).join(', ')})
    : AsyncWorker(callback), ${workerParams.map((p)=>`${p.name}(${p.name})`).join(', ')} {}
  ~${func.name}Worker() {}

  // Executed inside the worker-thread.
  // It is not safe to access V8, or V8 data structures
  // here, so everything we need for input and output
  // should go on 'this'.
  void Execute () {
    result = ${func.name}(${workerParams.map((p)=>p.name).join(', ')});
  }

  // Executed when the async work is complete
  // this function will be run inside the main event loop
  // so it is safe to use V8 again
  void HandleOKCallback () {
    Nan::HandleScope scope;
    Local<Value> argv[] = {
      ${v8asyncOutput(func.return)}
    };
    callback->Call(1, argv);
  }

 private:
  ${workerParams.map((p)=>`${p.type} ${p.name};`).join(os.EOL)}
  ${Generator.mapToCType(func.return)} result;
};
`;
}

export function nanMethod(
  func: IFunctionDefinition,
  parameters: string[],
  externParams: string[],
  deallocations: string[],
  v8ReturnValue: string
) {
let funcCall: string;
if (func.async) {
  funcCall = `
  Nan::Callback * callback = new Nan::Callback(info[${externParams.length}].As<v8::Function>());
  AsyncQueueWorker(new ${func.name}Worker(callback, ${externParams.join(", ")}));`;
  v8ReturnValue = '';
} else {
  funcCall = `${Generator.mapToCType(func.return)} result = ${func.name}(${externParams.join(", ")});`;
}
return ` ${func.async?asyncWorker(func):''}
NAN_METHOD(${func.name}) {`+
  `${parameters.join("")}
  ${funcCall}`+
  `${v8ReturnValue}`+
  `${deallocations.join('')}
}`;
}
