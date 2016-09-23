const Schedulers = {
  Base: require('./base'),
  RoundRobin: require('./roundrobin'),
  FirstAvailable: require('./firstavailable'),
  Random: require('./random'),
  WorkConserving: require('./workconserving'),
};

module.exports = Schedulers;
