/** A base class extendable error, great helper for building more error classes.
  * @memberof Errors
  */
class EExtendableError extends Error{
  /** Create a new error instance and assign appropriate stuff
    * @param {string} message - The error message itself
    * @param {object} additional - Object containing custom properties to add
    * to the error.
    */
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

/** Error thrown when there are no instances to process an event.
  * @memberof Errors
  */
class ENoInstances extends EExtendableError{
  /**
    * @param {string} forEvent - The name of the event that was attempted.
    */
  constructor(forEvent){
    super(`No workers to perform task ${forEvent}`);
  }
}

/** Error thrown when an instance is deregistered before it completes its work.
  * Typically happens when the worker is killed or throws a fatal exception.
  * @memberof Errors
  */
class EDeregisteredBeforeComplete extends EExtendableError{
  /**
    * @param {object} data - What data was sent to the event.
    */
  constructor(data){
    super(`Instance deregistered before completion`, {data});
  }
}

/** Error thrown when a named handler couldn't be located.
  * @memberof Errors
  */
class ENoHandler extends EExtendableError{
  /**
    * @param {string} handlerName - Name of the handler requested.
    */
  constructor(handlerName){
    super(`No handler defined with name ${handlerName}`);
  }
}

/** Error thrown when trying to create a new handler without a name.
  * @memberof Errors
  */
class ENoHandlerName extends EExtendableError{
  /**
    * @param {object} config - Configuration passed to create the handler.
    */
  constructor(config){
    super(`Handler with no name, must supply a name!`, {config});
  }
}

/** Error thrown when trying to create a duplicate named handler.
  * @memberof Errors
  */
class EDuplicateHandlerNamed extends EExtendableError{
  /**
    * @param {string} name - Name of the handler requested.
    * @param {object} config - Configuration passed to create the handler.
    */
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
