const ChildProcess  = require('./childprocess');
const EventEmitter = require('eventemitter2');
const Schedulers = require('./schedulers');
const SchedulerNames = Object.keys(Schedulers);
const async = require('async');
const path = require('path');

const {
  ENoHandler,
  ENoHandlerName,
  EDuplicateHandlerNamed,
} = require('./errors');

const noop = ()=>{};

const getScheduler = (requested, options)=>{
  if(typeof(requested)==='function'){
    return new requested(options);
  }
  if(typeof(requested)==='object'){
    return requested;
  }
  if(!requested){
    return new Schedulers.RoundRobin(options);
  }
  const reRequested = new RegExp(`^${requested||''}$`, 'i');
  const scheduler = SchedulerNames.find((n)=>reRequested.exec(n)) || 'RoundRobin';
  return new Schedulers[scheduler](options);
};

const DEFAULT_REGISTER_OPTIONS = {
  type: 'ipc',
  instances: 1,
  scheduler: Schedulers.RoundRobin
};

const createInstances = (instantiate, options, childCallback, doneCallback)=>{
  const startChild = (ready)=>{
    const child = new ChildProcess(options);
    child.once('ready', ()=>{
      ready(null, child);
    });
  };

  const startChildren = (toStart, callback)=>{
    if(toStart > 0){
      return startChild((err, child)=>{
        childCallback(child, ()=>{
          startChildren(toStart-1, callback);
        });
      });
    }
    return callback();
  };
  startChildren(instantiate, doneCallback);
};

const registerIpc = (manager, scheduler, options, ready)=>{
  const script = path.resolve(manager.basepath, options.source || `./${options.name}.js`);
  const registerChild = (child, next)=>{
    scheduler.register(child);
    child.on('exit', ()=>{
      child.emitter.removeAllListeners();
      scheduler.deregister(child);
      scheduler.emit('worker::died', child);
      manager.emit('worker::died', child);
    });
    manager.emit('worker::ready', child);
    return next();
  };
  const done = ()=>{
    return ready(null, scheduler);
  };
  const childOpts = {
      script,
      args: options.args,
      options: options.options
    };
  createInstances(options.numInstances, childOpts, registerChild, done);
};

class Manager extends EventEmitter{
  constructor({handlers = [], basepath = path.dirname(process.mainModule.filename)}){
    super({
      wildcard: true,
      delimiter: '::',
    });
    this.basepath = basepath;
    this.handlers = {};
    async.each(handlers, (config, next)=>{
      this.register(config, ()=>{
        next();
      });
    }, ()=>{
      setImmediate(()=>this.emit('ready'));
    });
  }

  register(options = DEFAULT_REGISTER_OPTIONS, callback = noop){
    if(!options.name){
      throw new ENoHandlerName(options);
    }
    const name = options.name;
    if(this.handlers[name]){
      throw new EDuplicateHandlerNamed(name, options);
    }
    if(!options.namespace){
      options.namespace = name;
    }
    const prefix = `${options.namespace}::`;
    const prefixLength = prefix.length;
    const scheduler = getScheduler(options.scheduler, options);
    scheduler.on('error', (e)=>this.emit('scheduler::error', e));

    if(options.type === 'ipc'){
      return registerIpc(this, scheduler, options, (err, handler)=>{
        this.on(`${prefix}*`, (data, callback)=>{
          const eventName = this.event.substr(prefixLength);
          handler.do(eventName, data, callback);
        });
        handler.options = options;
        this.handlers[name] = handler;
        return callback();
      });
    }
  }

  scaleDown(what, by = 1, callback = noop){
    const scheduler = this.with(what);
    while(by > 0){
      scheduler.kill();
      by--;
    }
    setImmediate(callback);
    return this;
  }

  scaleUp(what, by = 1, callback = noop){
    const handler = this.handlers[what];
    if(!handler){
      throw new ENoHandler(what);
    }
    if(handler.options.type === 'ipc'){
      const opts = Object.assign({}, handler.options, {numInstances: by});
      registerIpc(this, handler, opts, callback);
    }
  }

  with(what){
    return this.handlers[what];
  }

  do(what, data, callback){
    this.emit(what, data, callback);
  }
}

module.exports = Manager;
