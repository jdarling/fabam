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

/** Class wrapper for child_process.fork
  * @memberof Launchers
  */
class ChildProcess{
  /** Create a new child process worker using child_process.fork
    * @param {object} options - options or name of script to execute
    * @param {string} options.source - Name of script to execute
    * @param {Array} options.args - Any arguments to pass to the script
    * @param {object} options.options - Additional options to pass to child_process.fork
    * @param ...args - Any arguments to pass to the script
    */
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

  /** Terminates the child process with signal
    * @param {string} signal - Signal to send to child process, defaults to 'SIGTERM'
    */
  kill(signal = 'SIGTERM'){
    this.emit('kill', signal);
  }

  /** Send a message to the worker process
   * @param {string} event - Name of the event to send
   * @param {any} data - What data to send
   * @param {function} callback - Callback called when complete
   */
  emit(event, data, callback){
    if(typeof(callback) === 'function'){
      const id = `callback_${this.id}_${uuid()}`;
      this.once(id, callback);
      return this.send({event, data, id});
    }
    this.send({event, data});
  }

  /** Setup a listener for an event.  Called every time the worker gets the event.
    * @param {string} event - What even to listen for
    * @param {function} handler - function(data, done) handler for the event
    * @param {any} handler.data - Data to be processed
    * @param {function} handler.done - Function to return results to the manager
    */
  on(event, handler){
    this.emitter.on(event, handler);
  }

  /** Setup a listener for an event.  Called only once, then removed.
    * @param {string} event - What even to listen for
    * @param {function} handler - function(data) handler for the event
    */
  once(event, handler){
    this.emitter.once(event, handler);
  }

  /** Private internal, used to actually send messages back to the master
    * process.  See Node.js documentation for process.send for more info.
    */
  send(message, handle, options, callback){
    this.process.send(message, handle, options, callback);
  }
};

module.exports = ChildProcess;
