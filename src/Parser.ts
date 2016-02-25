import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as readline from 'readline';

import {IInterfaceDefinition, IFunctionDefinition} from './interfaces/IABIInterface';

export interface IParserSettings {
  noManglePattern: string,
  fnDefPattern: string,
  fnSigPattern: string
}

export class Parser {

  protected settings = {
    noManglePattern: '#[no_mangle]',
    fnDefPattern: 'pub extern "C" fn ',
    fnSigPattern: '(\\w+)\\s*\\((.*)\\)\\s*(->)?\\s*((\\*\\w*\\s*)?\\w*)'
  }

  constructor(protected source: NodeJS.ReadableStream, protected name: string, settings?: IParserSettings) {
    if (settings) Object.assign(this.settings, settings); //mutate settings
  }

  protected parseFunc (fnDef: string): IFunctionDefinition {
    var fnSig = fnDef.substr(this.settings.fnDefPattern.length)
    var fnSigRegex = new RegExp(this.settings.fnSigPattern, "g");
    console.log(fnSig);
    var parsed = fnSigRegex.exec(fnSig);
    if (!parsed) {
      console.error("can't parse "+fnSig);
      return;
    }
    var inputs = parsed[2].split(",").map(function(v){
        var input = v.split(":");
        console.log(input[1].replace(/(const|mut)/,"").replace(/\s*/g,""));
        return {name: input[0].trim(), type: input[1].replace(/(const|mut)*/g,"").replace(/\s*/g,"")};
    });
    if (parsed[4]) {
      var output = parsed[4].replace(/(const|mut)/,"").replace(/\s*/g,"")
    } else {
      console.log(parsed);
      var output = "void";
    }
    return {
      name: parsed[1],
      inputs: inputs,
      output: output
    }
  }

  protected parseInner = (resolve,reject) => {
    const rl = readline.createInterface({
      input: this.source
    });
    let s = this.settings;
    let prevMangle = false;
    let results = {
      module_name: path.basename(this.name),
      functions: []
    };
    rl.on('line', (line) => {
      if (prevMangle) {
        var fnDef = line.trim().replace(/\s+/g," ");
        if (fnDef.startsWith(s.fnDefPattern)) {
          var fnParsed = this.parseFunc(fnDef);
          if (fnParsed) {
            results.functions.push(fnParsed);
          }
        } else {
          console.error(s.noManglePattern+" is not followed by the line with"+s.fnDefPattern);
        }
      }
      if(line.trim().startsWith(s.noManglePattern)) {
        prevMangle = true;
      } else {
        prevMangle = false;
      }
    });
    rl.on('close',function(){
      console.log("found following extern functions:");
      console.log(JSON.stringify(results,null,"  "));
      resolve(results);
    });
  }

  public parse() {
    return new Promise(this.parseInner);
  }

}
