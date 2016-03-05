export enum LOGLEV {
  ERR = 1,
  INF = 2,
  WARN = 3,
  DEBUG = 4
}

export class Log {

  constructor(public level: LOGLEV = LOGLEV.INF) {}

  public err(msg: string) {
    if(this.level>=LOGLEV.ERR) console.error(msg);
  }
  public log(msg: string) {
    if(this.level>=LOGLEV.INF) console.log(msg);
  }
  public warn(msg: string) {
    if(this.level>=LOGLEV.WARN) console.warn(msg);
  }
  public debug(msg: any) {
    if(this.level>=LOGLEV.DEBUG) console.log(msg);
  }

}
