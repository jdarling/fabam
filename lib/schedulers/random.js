const Base = require('./base');

/** Probably the worst idea ever, but its quick and easy to implement.  Gives a
  * fair starting point of what it takes to write a minimal scheduler.
  *
  * **NOTE:** Doesn't keep track of if workers are in use or not, will keep
  * pushing work to a worker even if it is busy.
  * @memberof Schedulers
  */
class Random extends Base{
  _do(event, data, callback){
    const i = Math.floor(Math.random()*this.instances.length);
    this.callInstance(i, event, data, callback);
  }
};

module.exports = Random;
