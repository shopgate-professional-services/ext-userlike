import { createMessenger } from '@userlike/messenger';
import { logger, makeGetRoutePattern, UIEvents } from '@shopgate/engage/core';
import { SHEET_EVENTS } from '@shopgate/engage/components';
import config from '../config.json';
import { getUserData } from '../selectors';

const { widgetKey, pagesWithoutWidget } = config;

/**
 * Creates the "widget key" integration adapter.
 *
 * Integrates the Userlike Messenger via the `@userlike/messenger` package and a configured
 * widget key. This is the default integration method (introduced in 1.3.0).
 * @param {Function} isUserTrackingAllowed - Selector that tells if user data may be passed on.
 * @returns {Object} An integration adapter exposing init/hideWidget/showWidget/setUser/logout.
 */
export default (isUserTrackingAllowed) => {
  let messenger = null;
  let sheetListenersAdded = false;

  /**
   * Hides the Userlike Messenger button and notifications while keeping the main widget visible.
   * @returns {Promise<void>} Resolves once visibility has been updated or immediately.
   */
  const hideWidget = async () => {
    if (!messenger) {
      return;
    }
    await messenger.setVisibility({
      main: true,
      button: false,
      notifications: false,
    });
  };

  /**
   * Shows the Userlike Messenger main widget, button, and notifications.
   * @returns {Promise<void>} Resolves once visibility has been updated or immediately.
   */
  const showWidget = async () => {
    if (!messenger) {
      return;
    }
    await messenger.setVisibility({
      main: true,
      button: true,
      notifications: true,
    });
  };

  /**
   * Sets the Userlike Messenger contact information.
   * @param {Function} getState - Returns the current application state.
   * @returns {Promise<void>} Resolves once the contact info is set or exits if no user.
   */
  const setUser = async (getState) => {
    if (!messenger) {
      return;
    }

    const state = getState();
    if (!isUserTrackingAllowed(state)) {
      return;
    }

    const user = getUserData(state);
    if (!user) {
      return;
    }

    await messenger.setContactInfo({
      name: user.name || '',
      email: user.email || '',
    });
  };

  /**
   * Logs the current contact out of the Userlike Messenger.
   * @returns {Promise<void>} Resolves once logout is complete or immediately.
   */
  const logout = async () => {
    if (!messenger) {
      return;
    }

    await messenger.logout();
  };

  /**
   * Initializes the Userlike Messenger widget via the configured widget key.
   * @param {Function} getState - Returns the current application state.
   * @returns {Promise<void>} Resolves once initialization is complete or fails.
   */
  const init = async (getState) => {
    if (!widgetKey) {
      logger.warn('No Userlike widget key configured');
      return;
    }

    let result;

    try {
      result = await createMessenger({
        version: 2,
        widgetKey,
      });
    } catch (error) {
      logger.error('Userlike init error:', error);
      return;
    }

    if (result.kind === 'error') {
      logger.error('Userlike init error:', result.error);
      return;
    }

    const { api } = result.value;

    api.mount().subscribe(async (mountResult) => {
      if (mountResult.kind === 'error') {
        logger.error(mountResult.error);
        return;
      }

      if (mountResult.value === null) {
        messenger = null;
        logger.log('Userlike messenger not mounted');
        return;
      }

      messenger = mountResult.value;

      if (pagesWithoutWidget.includes(makeGetRoutePattern()(getState()))) {
        hideWidget();
      }

      if (!sheetListenersAdded) {
        sheetListenersAdded = true;

        UIEvents.addListener(SHEET_EVENTS.OPEN, hideWidget);
        UIEvents.addListener(SHEET_EVENTS.CLOSE, () => {
          const currentPattern = makeGetRoutePattern()(getState());

          if (!pagesWithoutWidget.includes(currentPattern)) {
            showWidget();
          }
        });
      }

      await setUser(getState);
    });
  };

  return {
    init,
    hideWidget,
    showWidget,
    setUser,
    logout,
  };
};
