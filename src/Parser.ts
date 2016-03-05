import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as readline from 'readline';
import {Log, LOGLEV} from './Log';
import * as prettyjson from 'prettyjson';

import {IInterfaceDefinition, IFunctionDefinition} from './interfaces/IABIInterface';

const l = new Log();

export interface IParserSettings {
  noManglePattern: string,
  fnDefPattern: string,
  fnSigPattern: string,
  verbosity?: LOGLEV
}

export class Parser {

  protected settings = {
    noManglePattern: '#[no_mangle]',
    fnDefPattern: 'pub extern "C" fn ',
    fnSigPattern: '(\\w+)\\s*\\((.*)\\)\\s*(->)?\\s*((\\*\\w*\\s*)?\\w*)',
    verbosity: LOGLEV.INF
  }

  constructor(protected source: NodeJS.ReadableStream, protected name: string, settings?: IParserSettings) {
    if (settings) Object.assign(this.settings, settings); //mutate settings
    l.level = this.settings.verbosity
  }

  protected parseFunc (fnDef: string): IFunctionDefinition {
    var fnSig = fnDef.substr(this.settings.fnDefPattern.length)
    var fnSigRegex = new RegExp(this.settings.fnSigPattern, "g");
    var parsed = fnSigRegex.exec(fnSig);
    if (!parsed) {
      l.err("can't parse "+fnSig);
      return;
    }
    var parameters = parsed[2].split(",").map(function(v){
        var param = v.split(":");
        return {name: param[0].trim(), type: param[1].replace(/(const|mut)*/g,"").replace(/\s*/g,"")};
    });
    if (parsed[4]) {
      var output = parsed[4].replace(/(const|mut)/,"").replace(/\s*/g,"")
    } else {
      var output = "void";
    }
    return {
      name: parsed[1],
      parameters: parameters,
      return: output
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
          l.err(s.noManglePattern+" is not followed by the line with"+s.fnDefPattern);
        }
      }
      if(line.trim().startsWith(s.noManglePattern)) {
        prevMangle = true;
      } else {
        prevMangle = false;
      }
    });
    rl.on('close',function(){
        l.log("Parse result:");
        l.wrapped(results, prettyjson.render);
      resolve(results);
    });
  }

  public parse() {
    return new Promise(this.parseInner);
  }

}
