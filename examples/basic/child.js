const {
  Worker
} = require('../../index');

const worker = new Worker();

worker.on('echo', (what, callback)=>{
  console.log(`child: ${what}`);
  callback(`echo: ${what}`);
});

worker.on('sayhello', ({name}, callback)=>{
  const timeout = 1000;
  setTimeout(()=>callback(`Hello ${name} from ${process.pid}`), timeout);
});

worker.ready();
