const Base = require('./base');

/** Starts at worker 0, sends a task, moves to worker 1, sends a task.  Keep
  * going to worker (n), then start over at worker 0 again.
  *
  * **NOTE:** Doesn't keep track of if workers are in use or not, will keep
  * pushing work to a worker even if it is busy.
  * @memberof Schedulers
  */
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
