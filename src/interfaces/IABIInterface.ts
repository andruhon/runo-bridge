export interface IFunctionDefinition {
  name: string;
  inputs: {name: string, type: string}[];
  output: string;
}

export interface IInterfaceDefinition {
  module_name: string;
  functions: IFunctionDefinition[];
}
