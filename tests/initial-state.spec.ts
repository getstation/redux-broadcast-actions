import { applyMiddleware, createStore, Middleware } from 'redux';
import {
  createGetInitialStateMiddleware,
  createSendInitialStateMiddleware,
  initialStateReducer
} from '../src/initial-state';

describe('initial-state', function () {
  let channel: BroadcastChannel;
  let dummyMiddleware: Middleware;
  let dummyFn: jest.Mock;

  beforeEach(() => {
    channel = { postMessage: jest.fn() } as any;
    dummyFn = jest.fn(x => x);
    dummyMiddleware = () => next => action => {
      return dummyFn(next(action));
    }
  });

  it('should ask for initial state and wait for it before dispatching', async function () {
    const store = createStore(x => x, applyMiddleware(createGetInitialStateMiddleware({ channel }), dummyMiddleware));

    expect(channel.postMessage).toHaveBeenCalledWith({ type: 'redux_broadcast_actions/ask' });
    expect(dummyFn).toHaveBeenCalledTimes(0);

    // initial state is not received yet, dispatched actions are stalling
    store.dispatch({
      type: 'dummy-1'
    });
    store.dispatch({
      type: 'dummy-2'
    });
    expect(dummyFn).toHaveBeenCalledTimes(0);

    // ignore other clients asking for state
    channel.onmessage!({
      data: {
        type: 'redux_broadcast_actions/ask',
      }
    } as any);
    expect(dummyFn).toHaveBeenCalledTimes(0);

    // receiving initial state
    channel.onmessage!({
      data: {
        type: 'redux_broadcast_actions/receive',
        payload: {
          a: 1
        }
      }
    } as any);

    // synchronously dispatching the state upon retrieval
    expect(dummyFn).toHaveBeenCalledTimes(1);
    expect(dummyFn).toHaveBeenLastCalledWith({
      type: 'redux_broadcast_actions/dispatch',
      payload: {
        a: 1
      },
      meta: {
        local: true
      }
    });

    // wait for stalling states to resolve
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(dummyFn).toHaveBeenCalledTimes(3);
    expect(dummyFn).toHaveBeenNthCalledWith(2, {
      type: 'dummy-1',
    });
    expect(dummyFn).toHaveBeenLastCalledWith({
      type: 'dummy-2',
    });
  });

  it('should apply initial state when reducer is provided', async function () {
    const store = createStore(initialStateReducer, applyMiddleware(createGetInitialStateMiddleware({ channel }), dummyMiddleware));

    channel.onmessage!({
      data: {
        type: 'redux_broadcast_actions/receive',
        payload: {
          a: 1
        }
      }
    } as any);

    expect(store.getState()).toEqual({
      a: 1
    });
  });

  it('should send initial state when asked for', async function () {
    createStore(x => x!, { b: 2 }, applyMiddleware(createSendInitialStateMiddleware({ channel })));
    const port = jest.fn();

    channel.onmessage!({
      data: {
        type: 'redux_broadcast_actions/ask'
      },
      ports: [{
        postMessage: port
      }]
    } as any);

    // do not dispatch to all clients
    expect(channel.postMessage).toHaveBeenCalledTimes(0);
    // send only to asking client
    expect(port).toHaveBeenCalledWith( {
      type: 'redux_broadcast_actions/receive',
      payload: {
        b: 2
      }
    });

    channel.onmessage!({
      data: {
        type: 'redux_broadcast_actions/ask'
      }
    } as any);

    // fallack to channel postMessage if no ports available
    expect(channel.postMessage).toHaveBeenCalledTimes(1);
  });
});