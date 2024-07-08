import { css } from 'glamor';
import { appDidStart$, logger, routeDidEnter$ } from '@shopgate/engage/core';
import { userDataReceived$, userDidLogout$ } from '@shopgate/engage/user';
import { makeGetRoutePattern } from '@shopgate/pwa-common/selectors/router';
import UIEvents from '@shopgate/pwa-core/emitters/ui';
import { SHEET_EVENTS } from '@shopgate/pwa-ui-shared/Sheet';
import { sdkUrl, pagesWithoutWidget } from './config';
import { getUserData } from './selectors';

let comfortCookiesAccepted$;
let getAreStatisticsCookiesSet;

try {
  // Try to import cookie consent related modules. "require()" is used since the currently deployed
  // PWA might not have the required modules implemented yet.

  /* eslint-disable global-require */
  ({ comfortCookiesAccepted$ } = require('@shopgate/engage/tracking/streams'));
  ({ getAreStatisticsCookiesSet } = require('@shopgate/engage/tracking/selectors'));
  /* eslint-enable global-require */
} catch (e) {
  // nothing to do here
}

// Prepare stream for extension initialization with fallback
const initializeWidget$ = comfortCookiesAccepted$ || appDidStart$;
// Prepare selector to determine if user tracking is allowed with fallback that always allows
const getIsUserTrackingAllowed = getAreStatisticsCookiesSet || (() => true);

export default (subscribe) => {
  const { style } = document.documentElement;
  let ready = false;

  // Flag to indicate if "live chat" or "unified messaging" is used
  let isUMWidget = false;

  /**
   *  Hides the userlike button
   */
  const hideWidget = () => {
    if (isUMWidget) {
      style.setProperty('--userlike-um-display', 'none');
    } else {
      window.userlike.userlikeHideButton();
    }
  };

  /**
   *  Shows the userlike button again
   */
  const showWidget = () => {
    if (isUMWidget) {
      style.setProperty('--userlike-um-display', 'block');
    } else {
      window.userlike.userlikeShowButton();
    }
  };

  subscribe(initializeWidget$, ({ getState }) => {
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
      background: 'rgb(34, 77, 143)',
    });

    css.global('#userlike.userlike-mobile.userlike-mobile #userlike-chat-content', {
      bottom: 'max(60px, calc(var(--safe-area-inset-bottom) * 3))',
    });
    css.global('#userlike-chat-scroll-textarea#userlike-chat-scroll-textarea', {
      bottom: 'var(--safe-area-inset-bottom)',
    });

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

    // callback that gets called from script if ready
    window.userlikeReady = () => {
      ready = true;
      const state = getState();
      const pattern = makeGetRoutePattern()(state);

      // new UM does not have an getData function (yet?)
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

      const user = getUserData(state);

      if (!user) {
        return;
      }

      window.userlike.setData({ user });
      window.userlike.userlikeUpdateAPI();
    };
  });

  subscribe(userDataReceived$, ({ getState }) => {
    const isUserTrackingAllowed = getIsUserTrackingAllowed(getState());

    if (!window.userlike || !ready || !isUserTrackingAllowed) {
      return;
    }

    const user = getUserData(getState());

    if (!user) {
      return;
    }

    window.userlike.setData({ user });
    window.userlike.userlikeUpdateAPI();
  });

  subscribe(userDidLogout$, () => {
    if (!window.userlike || !ready) {
      return;
    }

    window.userlike.setData({});
    window.userlike.userlikeUpdateAPI();
  });

  if (pagesWithoutWidget && pagesWithoutWidget.length) {
    subscribe(routeDidEnter$, ({ action }) => {
      if (!window.userlike) {
        return;
      }

      if (pagesWithoutWidget.includes(action.route.pattern)) {
        hideWidget();
      } else {
        showWidget();
      }
    });
  }
};

