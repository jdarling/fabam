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

/** Used to manage scheduler groups, generally you only need one per project.
  * Will deliver messages to workers through the group name and event type.
  */
class Manager extends EventEmitter{
  /** Create an instance
    * @param {object} options - The options passed in to the manager
    * @param {array} options.handlers - Array of schedulers to Create
    * @param {string} options.handlers.type - What type of launcher to use, defaults to 'ipc'
    * @param {string} options.handlers.name - What name will be used to access the scheduler workers
    * @param {Scheduler} options.handlers.scheduler - Name, Class, or Instance of scheduler to be used
    * @param {string} basepath - Basepath to load IPC workers from
    */
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

  /** Registers a new scheduler by name
    * @param {object} options - The options to determine what scheduler to use, what launcher, etc
    * @param {string} options.type - What type of launcher to use, defaults to 'ipc'
    * @param {string} options.name - What name will be used to access the scheduler workers
    * @param {Scheduler} options.scheduler - Name, Class, or Instance of scheduler to be used
    * @param {callback} callback - Optional, called once scheduler is ready and workers have been scaled up
    */
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

  /** Scales down (removes workers) a specific scheduler
    * @param {string} what - Name of scheduler to scale down
    * @param {number} by - How many workers to scale down, default 1
    * @param {callback} callback - Optional, called once workers have been scaled down
    */
  scaleDown(what, by = 1, callback = noop){
    const scheduler = this.with(what);
    while(by > 0){
      scheduler.kill();
      by--;
    }
    setImmediate(callback);
    return this;
  }

  /** Scales up (add workers) a specific scheduler
    * @param {string} what - Name of scheduler to scale down
    * @param {number} by - How many workers to scale up, default 1
    * @param {callback} callback - Optional, called once workers have been scaled up
    */
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

  /** Returns a scheduler to perform work with
    * @param {string} what - Name of scheduler to work with
    * @returns {Scheduler} Scheduler to work with
    */
  with(what){
    return this.handlers[what];
  }

  /** Sends an event to a scheduler
    * @param {string} what - Full name (schedulerName::eventName) of event to send
    * @param {any} data - What data to send with the eventName
    * @param {callback} callback - Callback to be called when worker has completed the task
    */
  do(what, data, callback){
    this.emit(what, data, callback);
  }
}

module.exports = Manager;
