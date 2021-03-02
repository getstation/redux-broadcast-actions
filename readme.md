# redux-broadcast-actions

A tiny middleware to broadcast your redux actions using the [Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API).
It can sync actions between tabs, and even between all processes of a [Browser Extension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions) (background, workers, content scripts, popup, custom pages).
Then you just need to plug all your pure reducers onto all your processes, and you have a state that is synced as simply as possible.

### How to install

Install with npm or yarn
```sh
npm install --save redux-broadcast-actions
# or
yarn add redux-broadcast-actions
```

### How to use
In all the processes where you need the actions to be dispatched and received, instanciate this middlware:

```ts
import { createStore, applyMiddleware } from 'redux';
import { createBroadcastActionsMiddleware } from 'redux-state-sync';

const config = {
  // name given to BroadcastChannel. Can also be a BroadcastChannel instance
  channel: 'redux_broadcast_actions',
};
const middlewares = [createBroadcastActionsMiddleware(config)];
const store = createStore(rootReducer, {}, applyMiddleware(...middlewares));
```

Then whenever you execute `store.dispatch(...)` in any process, all others are receiving the exact same action.

#### I do not want to broadcast one or more actions
You can do that. First, by default some events of some libs are not broadcasted (redux-form, redux-persist, and some others, check `shouldForward` function for details).
If you do not want to broadcast one of your action, you can leverage the `meta` property of your action like this:

```ts
dispatch({
  type: 'myAction',
  meta: {
    // this tells the middleware to not broadcast this action
    local: true,
  }
})
```