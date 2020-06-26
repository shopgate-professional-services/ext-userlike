import { css } from 'glamor';
import { appDidStart$, logger, routeDidEnter$ } from '@shopgate/engage/core';
import { userDataReceived$, userDidLogout$ } from '@shopgate/engage/user';
import { makeGetRoutePattern } from '@shopgate/pwa-common/selectors/router';
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

