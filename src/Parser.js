import * as fs from 'fs';

export class Parser {
  constructor(source, type) {
    console.log(1);
  }

  parse() {
    return new Promise(function(resolve,reject){
      setTimeout(resolve,500);
    });
  }

}
