import { css } from 'glamor';
import { appDidStart$, logger, routeDidEnter$ } from '@shopgate/engage/core';
import { userDataReceived$, userDidLogout$ } from '@shopgate/engage/user';
import { makeGetRoutePattern } from '@shopgate/pwa-common/selectors/router';
import UIEvents from '@shopgate/pwa-core/emitters/ui';
import { SHEET_EVENTS } from '@shopgate/pwa-ui-shared/Sheet';
import {
  sdkUrl,
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

  subscribe(comfortCookiesAccepted$, ({ getState }) => {
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
    const isUserTrackingAllowed = getAreStatisticsCookiesAccepted(getState());

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

