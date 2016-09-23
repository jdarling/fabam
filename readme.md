![Coffee Bean Logo](./logo/coffee-grains_32.png) Fabam
===

**Fabam is very early on in its development, use at your own risk!**

Process Scheduler/Manager for Node.js sub-processes.  Supports local (via IPC) processes and (in the future) remote workers.

Fabam is not a process manager like PM2, Forever, or similar.  It is not a scheduler like node-cron, cron, or similar.  Instead it is a Process Scheduler in the sense of Computing: "The method by which work specified by some means is assigned to resources that complete the work.  The work may be virtual computation elements such as threads, processes or data flows, which are in turn scheduled onto hardware resources such as processors, network links or expansion cards." https://en.wikipedia.org/wiki/Scheduling_(computing)

Fabam takes a slight twist in that it assigns process groups a name.  Each of these named groups can have a different scheduler assigned to it, and that scheduler is used to distribute the work.

Fabam can take care of starting and stopping local resources, and hopefully in the future starting and stopping remote resources (via SSH2).

##Install

```
npm install --save fabam
```

##Usage

For now see master.js and child.js in the examples/basic/ folder.  More info will be added as this library matures.

##Schedulers

###Random

Probably the worst idea ever, but its quick and easy to implement.  Gives a fair starting point of what it takes to write a minimal scheduler.

**NOTE:** Doesn't keep track of if workers are in use or not, will keep pushing work to a worker even if it is busy.

###Round-robin

Starts at worker 0, sends a task, moves to worker 1, sends a task.  Keep going to worker (n), then start over at worker 0 again.

**NOTE:** Doesn't keep track of if workers are in use or not, will keep pushing work to a worker even if it is busy.

###First Available

Pick a worker, remove it from the queue, send it work.  When the worker is complete (either by callback or by ready signal) then put the worker back on the end of the queue.  Attempts to give workers the most time to breathe between jobs.

**NOTE:** Keeps track if workers are busy, if they are will queue up work until a worker becomes available.

###Work-conserving

Pick a worker, remove it from the queue, send it work.  When the worker is complete (either by callback or by ready signal) then put the worker back on the front of the queue.  Attempts to always keep workers busy, favoring "warmed up" workers over idle ones.

**NOTE:** Keeps track if workers are busy, if they are will queue up work until a worker becomes available.

###BYOS (Bring Your Own Scheduler)

You can always write your own if you don't like any of the ones provided.  See existing workers for ideas on how to implement your own.

#Why Deregistered?

Honestly, this was so well answered on StackExchange http://english.stackexchange.com/a/40095/197643

Here it is in its full glory, in case you think that link is clickbait:

> This is a question that used to plague me for ages, until I finally sat down and thought it through.
>
> As a programmer, I see both used a lot, and often interchangeably. For me, I like to think of the question by beginning with another question: What is the 'not registered' state called?
>
> Let's assume you're a programmer, but keep in mind this is applies anywhere. When you have a variable which represents some item that can be registered, what do you call the function to discover if it is registered? In all likelihood, you'll call it 'isRegistered()'. So in that sense, you make the problem into a boolean. i.e. is it registered, or is it NOT registered.
>
> Then, from that logic, I believe your options simply become:
>
>  * isRegistered() - false if the object is 'unregistered' - i.e. 'not registered' false == isRegistered().
>  * registerSomething() - It has now moved from 'not registered' to 'registered'.
>  * deregisterSomething() - It has now moved from 'registered' to 'not registered'. i.e. 'unregistered'.
>
> This is why it's convention in programming to call an object that hasn't been 'initialised' as 'uninitialised', not 'deinitialised'. This implies it was never initialised to begin with, so its initial state is 'uninitialised'. If its initial state was called 'deinitialised' it would give the false impression that it was previously initialised.
>
> The bottom line for me is that you should define a convention for its use in your particular context, and stick to it. The above convention is what I now use throughout my code.
>
> Urgh... Here is all of that in a single line ;)
>
> state=unregistered -> 'register' -> state=registered -> 'deregister'
> -> state=unregistered.
>
> -- Shane

###Attributions

 * EventEmitter2 - https://github.com/asyncly/EventEmitter2 - Event filter
 * Async - http://caolan.github.io/async/ - Misc usage for control flow
 * SSH2 - https://github.com/mscdex/ssh2 - Start and stop remote workers
 * Node-UUID - https://github.com/broofa/node-uuid - Used to generate unique ID's for callback's

Icons used as Logo made by [Freepik](http://www.freepik.com) from [http://www.flaticon.com](http://www.flaticon.com) is licensed by [Creative Commons BY 3.0](http://creativecommons.org/licenses/by/3.0/) and can be found at http://www.flaticon.com/free-icon/coffee-grains_47408

#License - [DBAD](http://www.dbad-license.org/)

##DON'T BE A DICK PUBLIC LICENSE

Copyright(C) 2016 [Jeremy Darling](jeremy.darling@gmail.com)

DON'T BE A DICK PUBLIC LICENSE TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

Do whatever you like with the original work, just don't be a dick.

Being a dick includes - but is not limited to - the following instances:

1a. Outright copyright infringement - Don't just copy this and change the name.
1b. Selling the unmodified original with no work done what-so-ever, that's REALLY being a dick.
1c. Modifying the original work to contain hidden harmful content. That would make you a PROPER dick.

If you become rich through modifications, related works/services, or supporting the original work, share the love. Only a dick would make loads off this work and not buy the original work's creator(s) a pint.

Code is provided with no warranty. Using somebody else's code and bitching when it goes wrong makes you a DONKEY dick. Fix the problem yourself. A non-dick would submit the fix back.
