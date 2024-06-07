import type {OnyxUpdate} from 'react-native-onyx';
import Onyx from 'react-native-onyx';
import * as API from '@libs/API';
import type {UpdateSubscriptionAddNewUsersAutomaticallyParams, UpdateSubscriptionAutoRenewParams} from '@libs/API/parameters';
import {READ_COMMANDS, WRITE_COMMANDS} from '@libs/API/types';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';

/**
 * Fetches data when the user opens the SubscriptionSettingsPage
 */
function openSubscriptionPage() {
    API.read(READ_COMMANDS.OPEN_SUBSCRIPTION_PAGE, null);
}

function updateSubscriptionAutoRenew(autoRenew: boolean, disableAutoRenewReason?: string, disableAutoRenewAdditionalNote?: string) {
    const optimisticData: OnyxUpdate[] = [
        {
            onyxMethod: Onyx.METHOD.MERGE,
            key: ONYXKEYS.NVP_PRIVATE_SUBSCRIPTION,
            value: {
                autoRenew,
                pendingAction: CONST.RED_BRICK_ROAD_PENDING_ACTION.UPDATE,
                errors: null,
            },
        },
    ];

    const successData: OnyxUpdate[] = [
        {
            onyxMethod: Onyx.METHOD.MERGE,
            key: ONYXKEYS.NVP_PRIVATE_SUBSCRIPTION,
            value: {
                autoRenew,
                pendingAction: null,
                errors: null,
            },
        },
    ];

    const failureData: OnyxUpdate[] = [
        {
            onyxMethod: Onyx.METHOD.MERGE,
            key: ONYXKEYS.NVP_PRIVATE_SUBSCRIPTION,
            value: {
                autoRenew,
                pendingAction: null,
            },
        },
    ];

    const parameters: UpdateSubscriptionAutoRenewParams = {
        autoRenew,
        disableAutoRenewReason,
        disableAutoRenewAdditionalNote,
    };

    API.write(WRITE_COMMANDS.UPDATE_SUBSCRIPTION_AUTO_RENEW, parameters, {
        optimisticData,
        successData,
        failureData,
    });
}

function updateSubscriptionAddNewUsersAutomatically(addNewUsersAutomatically: boolean) {
    const optimisticData: OnyxUpdate[] = [
        {
            onyxMethod: Onyx.METHOD.MERGE,
            key: ONYXKEYS.NVP_PRIVATE_SUBSCRIPTION,
            value: {
                addNewUsersAutomatically,
                pendingAction: CONST.RED_BRICK_ROAD_PENDING_ACTION.UPDATE,
                errors: null,
            },
        },
    ];

    const successData: OnyxUpdate[] = [
        {
            onyxMethod: Onyx.METHOD.MERGE,
            key: ONYXKEYS.NVP_PRIVATE_SUBSCRIPTION,
            value: {
                addNewUsersAutomatically,
                pendingAction: null,
                errors: null,
            },
        },
    ];

    const failureData: OnyxUpdate[] = [
        {
            onyxMethod: Onyx.METHOD.MERGE,
            key: ONYXKEYS.NVP_PRIVATE_SUBSCRIPTION,
            value: {
                addNewUsersAutomatically,
                pendingAction: null,
            },
        },
    ];

    const parameters: UpdateSubscriptionAddNewUsersAutomaticallyParams = {
        addNewUsersAutomatically,
    };

    API.write(WRITE_COMMANDS.UPDATE_SUBSCRIPTION_ADD_NEW_USERS_AUTOMATICALLY, parameters, {
        optimisticData,
        successData,
        failureData,
    });
}

export {openSubscriptionPage, updateSubscriptionAutoRenew, updateSubscriptionAddNewUsersAutomatically};
