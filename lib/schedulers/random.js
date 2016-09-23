const Base = require('./base');

class Random extends Base{
  _do(event, data, callback){
    const i = Math.floor(Math.random()*this.instances.length);
    this.callInstance(i, event, data, callback);
  }
};

module.exports = Random;
