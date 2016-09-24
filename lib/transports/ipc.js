const path = require('path');
const ChildProcess = require('../launchers').ChildProcess;
const Base = require('./base');

/** Class representing Inter Process Communications (IPC) Transport for workers.
  * @memberof Transports
  */
class IPC extends Base{
  /** Create an IPC worker and return it when ready
    * @param {function} callback - Callback to be called when worker is ready.
    */
  createInstance(callback = noop){
    const script = path.resolve(this.options.basepath, this.options.source || `./${this.options.name}.js`);
    const options = Object.assign({}, this.options, {script});
    const instance = new ChildProcess(options);
    instance.once('ready', ()=>{
      callback(null, instance);
    });
  }
};

module.exports = IPC;
