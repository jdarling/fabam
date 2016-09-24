const noop = ()=>{};

class Base{
  constructor(options = {}){
    this.options = options;
    this.manager = options.manager;
    this.scheduler = options.scheduler;
  }

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
