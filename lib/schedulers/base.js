const EventEmitter = require('eventemitter2');
const {
  ENoInstances,
  EDeregisteredBeforeComplete,
} = require('../errors');
const isNumeric = (n)=>!isNaN(parseFloat(n)) && isFinite(n);

/** Class representing the basics needed for a scheduler
  */
class Base extends EventEmitter{
  /** Create an instance
    * @param {object} options - The options passed in to the instance
    * @param {array} instances - Already running worker instances
    */
  constructor({options = {}, instances = []}){
    super();
    this.options = options;
    this.instances = [];
    this.processing = [];
    instances.forEach(this.register.bind(this));
  }

  /** Check that there is a worker available to perform work.
    * Throws an error if there are no workers.
    * @param {string} event - Name of the event to be dispatched,
    * used for error message.
    */
  checkAvailableInstances(event){
    if(this.instances.length === 0){
      throw new ENoInstances(event);
    }
  }

  /** Registers a worker with the scheduler
    * @param {object} instance - The instance to register.
    */
  register(instance){
    this.instances.push(instance);
  }

  /** Deregisters an instance from the avialable worker instances.
    * @param {object} instance - The worker instance to remove.
    */
  deregister(instance){
    this.instances = this.instances.filter((inst)=>inst!==instance);
    const stillProcessing = this.processing.filter((entry)=>entry.instance === instance);
    stillProcessing.forEach((entry)=>{
      entry.callback(new EDeregisteredBeforeComplete(entry.data), entry.data);
    });
  }

  /** Sends the specified worker an event to process.
   * @param instanceOrIndex - Either the index of a worker or the actual worker
   * to send event to.
   * @param {string} event - The name of the event to send.
   * @param data - Whatever stringifyable value that is to be sent with the event.
   * @param {function} callback - The callback to be called when the event completes.
   */
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

  /** The actual method that picks a worker to send work to
    * @param {string} event - The name of the event to send.
    * @param data - Whatever stringifyable value that is to be sent with the event.
    * @param {function} callback - The callback to be called when the event completes.
    */
  _do(event, data, callback){
    return callInstance(0, event, data, callback);
  }

  /** Kills a worker
    * @param {string} signal - What kill signal to send to the worker
    */
  kill(signal = 'SIGTERM'){
    this.do('kill', signal);
  }

  /** Used to select a worker and send work to it.  Internally it uses _do and
    * checkAvailableInstances to perform the worker selection and delegation.
    * @param {string} event - The name of the event to send.
    * @param data - Whatever stringifyable value that is to be sent with the event.
    * @param {function} callback - The callback to be called when the event completes.
    */
  do(...args){
    this.checkAvailableInstances(args[0]);
    return this._do(...args);
  }
};

module.exports = Base;
