const EventEmitter = require('eventemitter2');

class Worker{
  constructor(){
    this.emitter = new EventEmitter();
    process.on('message', (m)=>this.emitter.emit(m.event, m.data, m.id));
    this.on('kill', (signal = 'SIGTERM')=>{
      process.kill(process.pid, signal);
    });
  }

  emit(event, data, callback){
    process.send({event, data});
  }

  ready(){
    this.emit('ready', this.id);
  }

  on(event, handler){
    this.emitter.on(event, (data, callbackId = false)=>{
      if(!callbackId){
        return handler(data);
      }
      return handler(data, (res)=>this.emit(callbackId, res));
    });
  }

  once(event, handler){
    this.emitter.once(event, handler);
  }
};

module.exports = Worker;
