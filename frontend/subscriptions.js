import { css } from 'glamor';
import { appDidStart$, routeDidEnter$ } from '@shopgate/engage/core';
import { userDataReceived$, userDidLogout$ } from '@shopgate/engage/user';
import config from './config.json';
import { getIsTablet } from './selectors';
import createMessengerWidget from './integrations/messengerWidget';
import createSdkScript from './integrations/sdkScript';

const {
  widgetKey,
  sdkUrl,
  integrationType,
  pagesWithoutWidget,
  iframeChatTitle,
  iframeBackgroundColor,
} = config;

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

/**
 * Resolves the active integration method.
 *
 * An explicit `integrationType` config value always wins. When it is 'auto' or not set (e.g. after
 * an upgrade from an older version that didn't have this key), the method is auto-detected from the
 * configured keys so that existing installations keep working: 1.2.x stores set only `sdkUrl`,
 * 1.3.x stores set only `widgetKey`. Fresh installs without any key default to `widgetKey`.
 * @returns {string} Either 'widgetKey' or 'sdkUrl'.
 */
const resolveIntegrationType = () => {
  if (integrationType === 'widgetKey' || integrationType === 'sdkUrl') {
    return integrationType;
  }

  if (!widgetKey && sdkUrl) {
    return 'sdkUrl';
  }

  return 'widgetKey';
};

export default (subscribe) => {
  const integration = resolveIntegrationType() === 'sdkUrl'
    ? createSdkScript(getAreStatisticsCookiesAccepted)
    : createMessengerWidget(getAreStatisticsCookiesAccepted);

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

    await integration.init(getState);
  });

  subscribe(userDataReceived$, async ({ getState }) => {
    await integration.setUser(getState);
  });

  subscribe(userDidLogout$, async () => {
    await integration.logout();
  });

  if (pagesWithoutWidget && pagesWithoutWidget.length) {
    subscribe(routeDidEnter$, ({ action }) => {
      if (pagesWithoutWidget.includes(action.route.pattern)) {
        integration.hideWidget();
      } else {
        integration.showWidget();
      }
    });
  }
};
