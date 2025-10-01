import { css } from 'glamor';
import { createMessenger } from '@userlike/messenger';
import { appDidStart$, logger, routeDidEnter$ } from '@shopgate/engage/core';
import { userDataReceived$, userDidLogout$ } from '@shopgate/engage/user';
import { makeGetRoutePattern } from '@shopgate/pwa-common/selectors/router';
import UIEvents from '@shopgate/pwa-core/emitters/ui';
import { SHEET_EVENTS } from '@shopgate/pwa-ui-shared/Sheet';
import {
  widgetKey,
  pagesWithoutWidget,
  iframeChatTitle,
  iframeBackgroundColor,
} from './config';
import { getUserData, getIsTablet } from './selectors';

let comfortCookiesAccepted$;
let getAreStatisticsCookiesAccepted;

try {
  // Try to import cookie consent related modules. "require()" is used since the currently deployed
  // PWA might not have the required modules implemented yet.

  /* eslint-disable eslint-comments/no-unlimited-disable */
  /* eslint-disable */
  ({ comfortCookiesAccepted$ } = require('@shopgate/engage/tracking/streams'));
  ({ getAreStatisticsCookiesAccepted } = require('@shopgate/engage/tracking/selectors'));
  /* eslint-enable  */
} catch (e) {
  // Configure fallbacks in case of an import error
  comfortCookiesAccepted$ = appDidStart$;
  getAreStatisticsCookiesAccepted = () => true;
}

export default (subscribe) => {
  let messenger = null;

  /**
   * Hides the Userlike Messenger button and notifications while keeping the main widget visible.
   * @returns {Promise<void>} Resolves once initialization is complete or fails.
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
   * @returns {Promise<void>} Resolves once visibility has been updated or immediately
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
   * Sets the Userlike Messenger contact information
   * @param {Function} getState - The current application state.
   * @returns {Promise<void>} Resolves once the contact info is set or exits if no user.
   */
  const setUser = async (getState) => {
    if (!messenger) {
      return;
    }

    const user = getUserData(getState());
    if (!user) {
      return;
    }

    await messenger.setContactInfo({
      name: user.name || '',
      email: user.mail || '',
    });
  };

  /**
   * Initializes the Userlike Messenger widget
   * @param {Function} getState - The current application state.
   * @returns {Promise<void>} Resolves once initialization is complete or fails.
   */
  const initMessenger = async (getState) => {
    if (!widgetKey) {
      logger.warn('No Userlike widget key configured');
      return;
    }

    const result = await createMessenger({
      version: 2,
      widgetKey,
    });

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
        logger.log('Userlike messenger not mounted');
        return;
      }

      messenger = mountResult.value;

      const state = getState();
      const pattern = makeGetRoutePattern()(state);

      if (pagesWithoutWidget.includes(pattern)) {
        hideWidget();
      }

      UIEvents.addListener(SHEET_EVENTS.OPEN, hideWidget);
      UIEvents.addListener(SHEET_EVENTS.CLOSE, () => {
        if (!pagesWithoutWidget.includes(pattern)) {
          showWidget();
        }
      });

      await setUser(getState);
    });
  };

  subscribe(comfortCookiesAccepted$, async ({ getState }) => {
    const isTablet = getIsTablet(getState());

    // "live chat" -> userlike-tab. "UM" -> #uslk-button
    css.global('#userlike-tab, #uslk-button, div[id^="userlike-"] iframe', {
      bottom: 'calc(16px + var(--tabbar-height) + var(--safe-area-inset-bottom) + var(--footer-height) ) !important',
    });
    css.global('#userlikeButtonContainer, div[id^="userlike-"]', {
      display: 'var(--userlike-um-display) !important',
    });

    css.global('#userlike-popup#userlike-popup, #uslk-messenger#uslk-messenger, div[id^="userlike-"] iframe[title="Messenger"]', {
      top: 'var(--safe-area-inset-top) !important',
      paddingTop: 'var(--safe-area-inset-top) !important',
      paddingBottom: 'calc(var(--safe-area-inset-bottom) * 2) !important',
    });

    // Position the userlike chat button above the footer
    css.global('[data-test-id="userlike-container"] [data-test-id="button"] > div', {
      transition: 'bottom 0.2s ease-in-out',
      // Take care about a little gap between chat button and footer when present.
      // When the device has safe area insets, position the button directly above the safe area,
      // when not keep a gap of 16px.
      bottom: 'max(calc(var(--footer-height) + 16px), max(var(--safe-area-inset-bottom), 16px))',
      // Widget visibility set via css variable (variable set in hideWidget/showWidget)
      display: 'var(--userlike-um-display)',
    });

    if (!isTablet) {
      css.global(`iframe[title="${iframeChatTitle || ''}"]`, {
        paddingTop: 'var(--safe-area-inset-top) !important',
        paddingBottom: 'var(--safe-area-inset-bottom) !important',
        background: iframeBackgroundColor || '#fff',
      });
    }

    css.global('#userlike.userlike-mobile.userlike-mobile #userlike-chat-content', {
      bottom: 'max(60px, calc(var(--safe-area-inset-bottom) * 3))',
    });
    css.global('#userlike-chat-scroll-textarea#userlike-chat-scroll-textarea', {
      bottom: 'var(--safe-area-inset-bottom)',
    });

    await initMessenger(getState);
  });

  subscribe(userDataReceived$, async ({ getState }) => {
    const isUserTrackingAllowed = getAreStatisticsCookiesAccepted(getState());

    if (!messenger || !isUserTrackingAllowed) {
      return;
    }

    await setUser(getState);
  });

  subscribe(userDidLogout$, async () => {
    if (!messenger) {
      return;
    }

    await messenger.logout();
  });

  if (pagesWithoutWidget && pagesWithoutWidget.length) {
    subscribe(routeDidEnter$, ({ action }) => {
      if (pagesWithoutWidget.includes(action.route.pattern)) {
        hideWidget();
      } else {
        showWidget();
      }
    });
  }
};
