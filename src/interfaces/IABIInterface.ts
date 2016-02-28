export interface IFunctionDefinition {
  name: string;
  parameters: {name: string, type: string}[];
  return: string;
}

export interface IInterfaceDefinition {
  module_name: string;
  functions: IFunctionDefinition[];
}
