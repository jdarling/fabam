const Base = require('./base');

const noop = ()=>{};

class WorkConserving extends Base{
  constructor(config){
    super(config);
    this.queue = [];
    this.available = [];
    this.on('workcompleted', ({instance})=>this.dequeue(instance));
  }

  register(instance){
    super.register(instance);
    this.available = [...this.available, instance];
  }

  deregister(instance){
    super.deregister(instance);
    this.available = this.available.filter((inst)=>inst!==instance);
  }

  enqueue(event, data, callback){
    this.queue = [...this.queue, {
      event,
      data,
      callback
    }];
    return this.processQueue();
  }

  processQueue(){
    const [
      instance,
      ...available
    ] = this.available;
    if(this.queue.length && instance){
      const [
        item,
        ...queue
      ] = this.queue;
      this.queue = queue;
      this.available = available;
      if(item.callback){
        return this.callInstance(instance, item.event, item.data, item.callback);
      }
      instance.once('ready', ()=>{
        dequeue(instance);
      });
      return this.callInstance(instance, item.event, item.data);
    }
    if(this.queue.length && (this.instances.length === 0)){
      return this.emit('error', new Error(`Work in queue, but no workers to perform it.`))
    }
  }

  dequeue(instance){
    if(this.instances.find((inst)=>inst===instance)){
      this.available = [instance, ...this.available];
    }
    this.processQueue();
  }

  _do(event, data, callback){
    return this.enqueue(event, data, callback);
  }
};

module.exports = WorkConserving;
