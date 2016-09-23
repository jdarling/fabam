const {
  ChildProcess,
  Manager,
  Schedulers
} = require('../../index');

// This is just a reimplementation of RoundRobin to show how its done
class CustomScheduler extends Schedulers.Base{
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
}

const manager = new Manager({
  handlers: [
    {
      // Some random name, child works in this case
      name: 'child',
      // The source file for the worker
      source: './child.js',
      // The type of worker it is, currently only IPC is supported
      type: 'ipc', // default
      // Number of instances to start initially
      numInstances: 2, // default 1
      // Take your pick of schedulers
      //scheduler: 'RoundRobin',
      //scheduler: Schedulers.FirstAvailable, // default Schedulers.RoundRobin
      //scheduler: 'WorkConserving',
      //scheduler: 'random', // default Schedulers.RoundRobin
      scheduler: CustomScheduler
    },
  ]
});

let i = 0;
const sayHello = ()=>{
  // Kill a worker every 3rd itteration
  if(i % 3 === 1){
    killNext();
  }
  // Add a worker every 5th itteration
  if(i % 5 === 1){
    startWorker();
  }
  // Basically after 9 itterations we should run out of workers
  manager.with('child').do('sayhello', {name: `World ${i++}`}, (err, response)=>{
    if(err){
      // NOTE: EDeregisteredBeforeComplete never happens with this setup
      // when using FirstAvailable or WorkConserving as they queue work
      // including the kill operation.  With other schedulers this may or may
      // not happen depending on when the child dies.
      console.error(`Child Error:`, err.toString().replace('Error: ', ''));
      if(response){
        console.error('Failed Data:');
        console.error(typeof(response)==='object'?JSON.stringify(response, null, '  '):response);
      }
      return;
    }
    if(response){
      console.log(`Child responded: ${response}`);
    }
  });
};

const startWorker = ()=>{
  // Couple ways to add a child
  manager.scaleUp('child');
  //manager.with('child').scaleUp();
};

const killNext = ()=>{
  // Lots of ways to kill off a child
  //manager.with('child').do('kill');
  //manager.with('child').do('kill', 'SIGTERM');
  //manager.with('child').instances[0].kill();
  manager.scaleDown('child');
};

manager.on('worker::ready', (worker)=>{
  console.log(`Worker ${worker.id} ready`);
});

manager.on('worker::died', (worker)=>{
  console.log(`Worker ${worker.id} died`);
});

manager.on('ready', ()=>{
  console.log('Master ready');
  setInterval(sayHello, 1000);
});

manager.on('error', (e)=>{
  console.error('Master error:', e);
});

manager.on('scheduler::error', (e)=>{
  console.error('Scheduler error:', e);
});

console.log('Expect this example to die with a "No workers" error after "Hello World 9"')
