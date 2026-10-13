import { logger, makeGetRoutePattern, UIEvents } from '@shopgate/engage/core';
import { SHEET_EVENTS } from '@shopgate/engage/components';
import config from '../config.json';
import { getUserData } from '../selectors';

const { sdkUrl, pagesWithoutWidget } = config;

/**
 * Creates the "JavaScript file" integration adapter.
 *
 * Integrates the Userlike chat by injecting the configured SDK script into the document and
 * controlling it via the global `window.userlike` API. This is the legacy integration method
 * (used up to 1.2.1) and supports both the classic "live chat" and "UM" widgets.
 * @param {Function} isUserTrackingAllowed - Selector that tells if user data may be passed on.
 * @returns {Object} An integration adapter exposing init/hideWidget/showWidget/setUser/logout.
 */
export default (isUserTrackingAllowed) => {
  const { style } = document.documentElement;
  let ready = false;
  let isUMWidget = false;

  /**
   * Hides the Userlike chat button.
   * @returns {void}
   */
  const hideWidget = () => {
    if (isUMWidget) {
      style.setProperty('--userlike-um-display', 'none');
      return;
    }

    if (!window.userlike || !ready) {
      return;
    }
    window.userlike.userlikeHideButton();
  };

  /**
   * Shows the Userlike chat button.
   * @returns {void}
   */
  const showWidget = () => {
    if (isUMWidget) {
      style.setProperty('--userlike-um-display', 'block');
      return;
    }

    if (!window.userlike || !ready) {
      return;
    }
    window.userlike.userlikeShowButton();
  };

  /**
   * Sets the Userlike chat contact information.
   * @param {Function} getState - Returns the current application state.
   * @returns {void}
   */
  const setUser = (getState) => {
    if (!window.userlike || !ready) {
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

    window.userlike.setData({ user });
    window.userlike.userlikeUpdateAPI();
  };

  /**
   * Resets the Userlike chat contact information on logout.
   * @returns {void}
   */
  const logout = () => {
    if (!window.userlike || !ready) {
      return;
    }

    window.userlike.setData({});
    window.userlike.userlikeUpdateAPI();
  };

  /**
   * Initializes the Userlike chat by injecting the configured SDK script.
   * @param {Function} getState - Returns the current application state.
   * @returns {void}
   */
  const init = (getState) => {
    if (!sdkUrl) {
      logger.warn('Userlike: No url configured');
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = sdkUrl;
    const parent = document.getElementsByTagName('head')[0];
    parent.appendChild(script);

    window.userlikeReady = () => {
      ready = true;
      const pattern = makeGetRoutePattern()(getState());

      isUMWidget = typeof window.userlike.getData !== 'function';

      if (pagesWithoutWidget.includes(pattern)) {
        hideWidget();
      }

      UIEvents.addListener(SHEET_EVENTS.OPEN, hideWidget);
      UIEvents.addListener(SHEET_EVENTS.CLOSE, () => {
        const currentPattern = makeGetRoutePattern()(getState());

        if (!pagesWithoutWidget.includes(currentPattern)) {
          showWidget();
        }
      });

      setUser(getState);
    };
  };

  return {
    init,
    hideWidget,
    showWidget,
    setUser,
    logout,
  };
};
