const EventEmitter = require('eventemitter2');

/** Base class to derrive workers from
  * @example <caption>Simple worker that prepends "echo: " to whatever it is sent and then sends it back to the manager</caption>
  * const {
  *   Worker
  * } = require('fabam');
  *
  * const worker = new Worker();
  *
  * worker.on('echo', (what, callback)=>{
  *   callback(`echo: ${what}`);
  * });
  *
  * worker.ready();
  */
class Worker{
  /** Create an instance
    */
  constructor(){
    this.emitter = new EventEmitter();
    process.on('message', (m)=>this.emitter.emit(m.event, m.data, m.id));
    this.on('kill', (signal = 'SIGTERM')=>{
      process.kill(process.pid, signal);
    });
  }

  /** Send a message back to the manager
   * @param {string} event - Name of the event to send back
   * @param {any} data - What data to send back
   */
  emit(event, data){
    process.send({event, data});
  }

  /** Let the manager know we are ready for work
   */
  ready(){
    this.emit('ready', this.id);
  }

  /** Setup a listener for an event.  Called every time the worker gets the event.
    * @param {string} event - What even to listen for
    * @param {function} handler - function(data, done) handler for the event
    * @param {any} handler.data - Data to be processed
    * @param {function} handler.done - Function to return results to the manager
    */
  on(event, handler){
    this.emitter.on(event, (data, callbackId = false)=>{
      if(!callbackId){
        return handler(data);
      }
      return handler(data, (res)=>this.emit(callbackId, res));
    });
  }

  /** Setup a listener for an event.  Called only once, then removed.
    * @param {string} event - What even to listen for
    * @param {function} handler - function(data) handler for the event
    */
  once(event, handler){
    this.emitter.once(event, handler);
  }
};

module.exports = Worker;
