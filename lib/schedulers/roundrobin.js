const Base = require('./base');

class RoundRobin extends Base{
  constructor(config){
    super(config);
    this.offset = 0;
  }

  _do(event, data, callback){
    let i = this.offset++;
    if(this.offset >= this.instances.length){
      this.offset = 0;
    }
    if(i >= this.instances.length){
      i = 0;
    }
    this.callInstance(i, event, data, callback);
  }
};

module.exports = RoundRobin;
