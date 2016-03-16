export interface IFunctionParemeterDefinition {
  name: string, type: string
}

export interface IFunctionDefinition {
  name: string;
  parameters: IFunctionParemeterDefinition[];
  return: string;
  async?: boolean;
}

export interface IInterfaceDefinition {
  module_name: string;
  functions: IFunctionDefinition[];
}
