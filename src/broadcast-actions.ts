import type { AnyAction, Middleware } from 'redux';
import type { Config } from './types';

const defaultConfig: Config = {
    channel: 'redux_broadcast_actions',
};

function shouldForward(action: AnyAction): boolean {
    return (action.type && (action.type.substr(0, 2) !== '@@' || action.type.startsWith('@@redux-ui')))
    && (action.type && !action.type.startsWith('redux-form') && !action.type.startsWith('persist/'))
    && (!action.meta || !action.meta.local);
}

export const createBroadcastActionsMiddleware = (config = defaultConfig): Middleware => {
    const channel = (typeof config.channel === 'object') ? config.channel : new BroadcastChannel(config.channel);

    return ({ dispatch }) => {
        channel.onmessage = ({ data }) => dispatch({
            ...data,
            meta: {
                ...data.meta,
                local: true,
            }
        });
        return next => action => {
            if (shouldForward(action)) {
                channel.postMessage(action);
            }

            return next(action);
        }
    };
};
