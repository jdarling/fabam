const path = require('path');
const ChildProcess = require('../launchers').ChildProcess;
const Base = require('./base');

class IPC extends Base{
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
