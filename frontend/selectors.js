import { createSelector } from 'reselect';
import { getUserDisplayName, getUserEmail } from '@shopgate/engage/user';
import { getDeviceInformation } from '@shopgate/engage/core';

export const getUserData = createSelector(
  getUserDisplayName,
  getUserEmail,
  (name, email) => {
    if (!email || !name) {
      return null;
    }

    return {
      name,
      email,
    };
  }
);

export const getIsTablet = createSelector(
  getDeviceInformation,
  deviceInformation => deviceInformation && deviceInformation.type === 'tablet'
);
