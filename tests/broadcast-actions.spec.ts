import { Store } from 'redux';
import { createBroadcastActionsMiddleware } from '../src/broadcast-actions';

describe('redux-broadcast-actions', function () {
  let channel: BroadcastChannel;
  let middleware: ReturnType<typeof createBroadcastActionsMiddleware>;
  let dispatch: jest.Mock;
  let next: jest.Mock;

  beforeEach(() => {
    channel = { postMessage: jest.fn() } as any;
    middleware = createBroadcastActionsMiddleware({ channel });
    dispatch = jest.fn();
    next = jest.fn();
  });

  it('should not forward actions marked as local', function () {
    middleware({ dispatch } as unknown as Store)(next)({
      meta: {
        local: true,
      }
    });

    expect(dispatch).toBeCalledTimes(0);
    expect(next).toBeCalledTimes(1);
    expect(channel.postMessage).toBeCalledTimes(0);
  });

  it('should not forward actions with type starting with @@', function () {
    middleware({ dispatch } as unknown as Store)(next)({
      type: '@@something'
    });

    expect(dispatch).toBeCalledTimes(0);
    expect(next).toBeCalledTimes(1);
    expect(channel.postMessage).toBeCalledTimes(0);
  });

  it('should forward actions with type @@redux-ui', function () {
    middleware({ dispatch } as unknown as Store)(next)({
      type: '@@redux-ui'
    });

    expect(dispatch).toBeCalledTimes(0);
    expect(next).toBeCalledTimes(1);
    expect(channel.postMessage).toBeCalledTimes(1);
  });

  it('should not forward actions with type starting with redux-form', function () {
    middleware({ dispatch } as unknown as Store)(next)({
      type: 'redux-form'
    });

    expect(dispatch).toBeCalledTimes(0);
    expect(next).toBeCalledTimes(1);
    expect(channel.postMessage).toBeCalledTimes(0);
  });

  it('should not forward actions with type starting with persist/', function () {
    middleware({ dispatch } as unknown as Store)(next)({
      type: 'persist/REHYDRATE'
    });

    expect(dispatch).toBeCalledTimes(0);
    expect(next).toBeCalledTimes(1);
    expect(channel.postMessage).toBeCalledTimes(0);
  });

  it('should not forward actions without a type', function () {
    middleware({ dispatch } as unknown as Store)(next)({});

    expect(dispatch).toBeCalledTimes(0);
    expect(next).toBeCalledTimes(1);
    expect(channel.postMessage).toBeCalledTimes(0);
  });

  it('should forward any other actions with a type', function () {
    middleware({ dispatch } as unknown as Store)(next)({
      type: 'something'
    });

    expect(dispatch).toBeCalledTimes(0);
    expect(next).toBeCalledTimes(1);
    expect(channel.postMessage).toBeCalledTimes(1);
  });
});