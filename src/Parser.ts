import * as fs from 'fs';

export class Parser {
  constructor(source: NodeJS.ReadableStream) {
    console.log(1);
  }

  parse() {
    return new Promise(function(resolve,reject){
      fs.readdir(".");
      setTimeout(resolve,500);
    });
  }

}
