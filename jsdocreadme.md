![Coffee Bean Logo](../logo/coffee-grains_32.png) Fabam
===

Process Scheduler/Manager for Node.js sub-processes.  Supports local (via IPC) processes and (in the future) remote workers.

Fabam is not a process manager like PM2, Forever, or similar.  It is not a scheduler like node-cron, cron, or similar.  Instead it is a Process Scheduler in the sense of Computing: "The method by which work specified by some means is assigned to resources that complete the work.  The work may be virtual computation elements such as threads, processes or data flows, which are in turn scheduled onto hardware resources such as processors, network links or expansion cards." https://en.wikipedia.org/wiki/Scheduling_(computing)

Fabam takes a slight twist in that it assigns process groups a name.  Each of these named groups can have a different scheduler assigned to it, and that scheduler is used to distribute the work.

Fabam can take care of starting and stopping local workers, and hopefully in the future starting and stopping remote workers (via SSH2).
