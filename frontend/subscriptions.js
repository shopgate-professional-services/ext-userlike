import { css } from 'glamor';
import { appDidStart$, logger, routeDidEnter$ } from '@shopgate/engage/core';
import { userDataReceived$, userDidLogout$ } from '@shopgate/engage/user';
import { makeGetRoutePattern } from '@shopgate/pwa-common/selectors/router';
import UIEvents from '@shopgate/pwa-core/emitters/ui';
import { SHEET_EVENTS } from '@shopgate/pwa-ui-shared/Sheet';
import { sdkUrl, pagesWithoutWidget } from './config';
import { getUserData } from './selectors';

export default (subscribe) => {
  const { style } = document.documentElement;
  let ready = false;

  // "live chat" -> userlike-tab. "UM" -> #uslk-button
  css.global('#userlike-tab, #uslk-button', {
    bottom: 'calc(10px + var(--safe-area-inset-bottom) + var(--footer-height) ) !important',
  });
  css.global('#userlikeButtonContainer', {
    display: 'var(--userlike-um-display) !important',
  });

  css.global('#userlike-popup#userlike-popup, #uslk-messenger#uslk-messenger', {
    top: 'var(--safe-area-inset-top) !important',
    paddingBottom: 'calc(var(--safe-area-inset-bottom) * 2) !important',
    background: 'rgb(249, 249, 249)',
  });

  css.global('#userlike.userlike-mobile.userlike-mobile #userlike-chat-content', {
    bottom: 'max(60px, calc(var(--safe-area-inset-bottom) * 3))',
  });
  css.global('#userlike-chat-scroll-textarea#userlike-chat-scroll-textarea', {
    bottom: 'var(--safe-area-inset-bottom)',
  });

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

  subscribe(appDidStart$, ({ getState }) => {
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
    if (!window.userlike || !ready) {
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

