const EventEmitter = require('eventemitter2');
const {
  ENoInstances,
  EDeregisteredBeforeComplete,
} = require('../errors');
const isNumeric = (n)=>!isNaN(parseFloat(n)) && isFinite(n);

class Scheduler extends EventEmitter{
  constructor({options = {}, instances = []}){
    super();
    this.options = options;
    this.instances = [];
    this.processing = [];
    instances.forEach(this.register.bind(this));
  }

  checkAvailableInstances(event){
    if(this.instances.length === 0){
      throw new ENoInstances(event);
    }
  }

  register(instance){
    this.instances.push(instance);
  }

  deregister(instance){
    this.instances = this.instances.filter((inst)=>inst!==instance);
    const stillProcessing = this.processing.filter((entry)=>entry.instance === instance);
    stillProcessing.forEach((entry)=>{
      entry.callback(new EDeregisteredBeforeComplete(entry.data), entry.data);
    });
  }

  callInstance(instanceOrIndex, event, data, callback){
    const instance = isNumeric(instanceOrIndex)?this.instances[instanceOrIndex]:instanceOrIndex;
    if(typeof(callback)==='function'){
      this.processing.push({instance, callback, data});
      this.emit('workstarted', instance);
      return instance.emit(event, data, (response)=>{
        this.processing = this.processing.filter((entry)=>!(entry.instance === instance && entry.callback === callback));
        this.emit('workcompleted', {instance, response});
        return callback(null, response);
      });
    }
    return instance.emit(event, data);
  }

  _do(event, data, callback){
    return callInstance(0, event, data, callback);
  }

  kill(signal = 'SIGTERM'){
    this.do('kill', signal);
  }

  do(...args){
    this.checkAvailableInstances(args[0]);
    return this._do(...args);
  }
};

module.exports = Scheduler;
