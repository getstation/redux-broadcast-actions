import type { Middleware, Reducer } from 'redux';
import type { Config } from './types';

const defaultConfig: Config = {
  channel: 'redux_broadcast_actions_initial_state',
};

const initActionAsk = {
  type: 'redux_broadcast_actions/ask'
}

const initActionReceive = {
  type: 'redux_broadcast_actions/receive'
}

const initActionDispatch = {
  type: 'redux_broadcast_actions/dispatch'
}

function defer() {
  let res: (value: unknown | PromiseLike<unknown>) => void;
  let done = false;

  const promise = new Promise((resolve) => {
    res = resolve;
  });

  return {
    promise,
    // @ts-ignore
    resolve: () => {
      done = true;
      res(undefined);
    },
    get done() {
      return done;
    }
  };
}

export const createGetInitialStateMiddleware = (config = defaultConfig): Middleware => {
  const channel = (typeof config.channel === 'object') ? config.channel : new BroadcastChannel(config.channel);

  return ({ dispatch }) => {
    const initReceived = defer();
    channel.postMessage(initActionAsk);
    channel.onmessage = ({ data }) => {
      if (data && data.type === initActionReceive.type) {
        dispatch({
          type: initActionDispatch.type,
          payload: data.payload,
          meta: {
            local: true,
          }
        });
      }
      initReceived.resolve();
    };

    return next => action => {
      if (initReceived.done || (action && action.type === initActionDispatch.type)) {
        return next(action);
      } else {
        initReceived.promise.then(() => next(action));
        return;
      }
    }
  };
};

export const createSendInitialStateMiddleware = (config = defaultConfig): Middleware => {
  const channel = (typeof config.channel === 'object') ? config.channel : new BroadcastChannel(config.channel);

  return ({ getState }) => {
    channel.onmessage = ({ data, ports }) => {
      if (data && data.type === initActionAsk.type) {
        ports[0].postMessage(getState());
      }
    };
    return next => action => {
      return next(action);
    }
  };
};

export const initialStateReducer: Reducer = (state, action) => {
  if (action && action.type === initActionDispatch.type) {
    return action.payload;
  }
  return state;
}
