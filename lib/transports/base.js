const noop = ()=>{};

/** Class representing the basics needed for a protocol
  * @memberof Transports
  */
class Base{
  /** Create an instance of the Protocol
    * @param {object} options - The options passed in to the instance
    * @param {Manager} options.manager - The manager assigned to the protocol
    * @param {Manager} options.scheduler - Optional scheduler to create workers for.
    */
  constructor(options = {}){
    this.options = options;
    this.manager = options.manager;
    this.scheduler = options.scheduler;
  }

  /** Register a worker instance with the manager and scheduler
    * @param {object} instance - The instance to register
    * @param {Scheduler} scheduler - Optional scheduler to register worker with,
    * if not supplied then class options.scheduler will be used.
    */
  registerInstance(instance, scheduler = this.options.scheduler){
    const manager = this.manager;
    scheduler.register(instance);
    instance.on('exit', ()=>{
      instance.emitter.removeAllListeners();
      scheduler.deregister(instance);
      scheduler.emit('worker::died', instance);
      manager.emit('worker::died', instance);
    });
    manager.emit('worker::ready', instance);
  }

  /** Create a new worker instance and register it with the manager and scheduler.
    * @param {object} options - Options
    * @param {Scheduler} options.scheduler - Optional scheduler to register worker with,
    * if not supplied then class options.scheduler will be used.
    * @param {function} callback - Callback to be called once worker is created and registered.
    */
  getInstance({scheduler}, callback = noop){
    this.createInstance((err, instance)=>{
      if(err){
        return callback(err);
      }
      this.registerInstance(instance, scheduler);
      return callback(null, instance);
    });
  }
};

module.exports = Base;
