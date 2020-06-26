import { css } from 'glamor';
import { appDidStart$, logger, routeDidEnter$ } from '@shopgate/engage/core';
import { userDataReceived$, userDidLogout$ } from '@shopgate/engage/user';
import { makeGetRoutePattern } from '@shopgate/pwa-common/selectors/router';
import { sdkUrl, pagesWithoutWidget } from './config';
import { getUserData } from './selectors';

export default (subscribe) => {
  let ready = false;

  css.global('#userlike-tab', {
    bottom: 'calc(10px + var(--safe-area-inset-bottom) + var(--footer-height) ) !important',
  });

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

      if (pagesWithoutWidget.includes(pattern)) {
        window.userlike.userlikeHideButton();
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

  subscribe(routeDidEnter$, ({ action }) => {
    if (!window.userlike) {
      return;
    }

    if (pagesWithoutWidget.includes(action.route.pattern)) {
      window.userlike.userlikeHideButton();
    }
  });

  subscribe(routeDidEnter$, ({ action }) => {
    if (!window.userlike) {
      return;
    }

    if (!pagesWithoutWidget.includes(action.route.pattern)) {
      window.userlike.userlikeShowButton();
    }
  });
};

