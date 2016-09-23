const {
  fork
} = require('child_process');
const EventEmitter = require('eventemitter2');
const os = require('os');
const uuid = require('uuid').v4;

const WRAP_EVENTS = [
  'close',
  'disconnect',
  'exit',
  'error'
];
const WRAP_PROPS = [
  'stderr',
  'stdin',
  'stdout',
  'stdio'
];

class ChildProcess{
  constructor(options, ...args){
    if(typeof(options)==='string'){
      options = {
        source: options,
        args: args[0],
        options: args[1]
      };
    }
    this.process = fork(options.script, options.args, options.options);
    this.emitter = new EventEmitter();
    this.id = `${os.hostname()}-${this.process.pid}`;
    WRAP_EVENTS.forEach((event)=>this.process.on(event, (...args)=>this.emitter.emit(event, ...args)));
    WRAP_PROPS.forEach((prop)=>this[prop]=this.process[prop]);
    this.process.on('message', (m)=>this.emitter.emit(m.event, m.data));
  }

  kill(signal = 'SIGTERM'){
    this.emit('kill', signal);
  }

  emit(event, data, callback){
    if(typeof(callback) === 'function'){
      const id = `callback_${this.id}_${uuid()}`;
      this.once(id, callback);
      return this.send({event, data, id});
    }
    this.send({event, data});
  }

  on(event, handler){
    this.emitter.on(event, handler);
  }

  once(event, handler){
    this.emitter.once(event, handler);
  }

  send(message, handle, options, callback){
    this.process.send(message, handle, options, callback);
  }
};

module.exports = ChildProcess;
