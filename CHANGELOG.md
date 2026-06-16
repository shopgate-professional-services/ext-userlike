# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.4.0] 2026-10-02
### Added
- Support for both integration methods in a single version. The `widgetKey` integration (via `@userlike/messenger`) remains the default; the legacy JavaScript SDK file integration (`sdkUrl`) can be selected again.
- New `integrationType` select (`auto`, `widgetKey`, `sdkUrl`). The default `auto` detects the method from the configured keys, so upgrades from 1.2.x (`sdkUrl`) and 1.3.x (`widgetKey`) keep working without manual changes.
- Re-introduced the `sdkUrl` config key (removed in 1.3.0).

### Changed
- Split the integration logic into two adapters (`frontend/integrations/messengerWidget.js`, `frontend/integrations/sdkScript.js`) behind a shared subscriptions wiring.
- Updated the lint toolchain to the current `@shopgate` 7.31 line.
- Platform modules are now imported via `@shopgate/engage` instead of deep `@shopgate/pwa-*` imports (requires PWA 6.8.0 or newer, as before; now declared as `@shopgate/engage` peer dependency).

### Fixed
- Customer name and email are only passed to Userlike when statistics cookies were accepted – this now also applies when the chat starts, not only on later user data updates.
- Widget key integration: the customer's email address is now passed to Userlike.
- Widget key integration: closing a sheet now checks the current page against `pagesWithoutWidget` instead of the page the widget was mounted on.
- Widget key integration: a failing Userlike script load is logged instead of causing an unhandled promise rejection.
- Widget key integration: sheet listeners are registered only once, even if the messenger mounts again, and an unmounted messenger is no longer addressed.

### Upgrade notes
- Stores upgrading from 1.2.x should check `iframeChatTitle`: its default changed from `"Kundensupport-Chat"` to `"Chat"` in 1.3.0. If the value was never saved, the safe-area styling no longer matches the chat iframe.

## [1.3.0] 2025-09-09
### Fixed
- Replaced the deprecated `userlikeReady` callback with the `createMessenger` API and subscription-based initialization.
- Removed deprecated `userlikeShowButton` / `userlikeHideButton` calls; widget visibility is now controlled via `messenger.setVisibility`.
- Updated configuration key from `sdkUrl` to `widgetKey`

## [1.2.1] 2025-06-06
### Fixed
- Fixed positioning above the PWA footer elements
- Fixed visibility logic for `pagesWithoutWidget` config setting

## [1.2.0] 2025-05-23
### Added
- Added `iframeChatTitle` config key for iframe `title` selector targeting
- Added `iframeBackgroundColor` config key to prevent underlying elements showing through

### Fixed
- Chat iframe no longer overlaps the safe area

## [1.1.0] 2023-08-05
### Added
- Support for PWA cookie consent feature. Widget initialization is postponed till users finished the consent process. When no "comfort" consent is given, the widget will not show up.

## [1.0.4] 2022-12-06
### Fixed
- changed styling to fit devices with notch.

## [1.0.2] 2020-09-16
### Fixed
- add new styling for new markup from userlike

## [1.0.1] 2020-08-06
### Fixed
- removed default sdk url

## [1.0.0] 2020-08-06
### Added
- Initial release

[1.0.0]: https://github.com/shopgate-professional-services/ext-userlike/releases/v1.0.0
