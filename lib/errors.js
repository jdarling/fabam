class EExtendableError extends Error{
  constructor(message, additional){
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    if(additional){
      Object.keys(additional).forEach((key)=>this[key]=additional[key]);
    }
    if(typeof Error.captureStackTrace === 'function'){
      Error.captureStackTrace(this, this.constructor);
    }else{
      this.stack = (new Error(message)).stack;
    }
  }
}

class ENoInstances extends EExtendableError{
  constructor(forEvent){
    super(`No workers to perform task ${forEvent}`);
  }
}

class EDeregisteredBeforeComplete extends EExtendableError{
  constructor(data){
    super(`Instance deregistered before completion`, {data});
  }
}

class ENoHandler extends EExtendableError{
  constructor(handlerName){
    super(`No handler defined with name ${handlerName}`);
  }
}

class ENoHandlerName extends EExtendableError{
  constructor(config){
    super(`Handler with no name, must supply a name!`, {config});
  }
}

class EDuplicateHandlerNamed extends EExtendableError{
  constructor(name, config){
    super(`Duplicate handler registration attempted for name ${name}`, {config});
  }
}

module.exports = {
  EExtendableError,
  ENoInstances,
  EDeregisteredBeforeComplete,
  ENoHandler,
  ENoHandlerName,
  EDuplicateHandlerNamed,
};
