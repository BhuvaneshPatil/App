import {DeviceEventEmitter} from 'react-native';
import type {NativeConfig} from 'react-native-config';
import E2ELogin from '@libs/E2E/actions/e2eLogin';
import waitForAppLoaded from '@libs/E2E/actions/waitForAppLoaded';
import E2EClient from '@libs/E2E/client';
import getConfigValueOrThrow from '@libs/E2E/utils/getConfigValueOrThrow';
import getPromiseWithResolve from '@libs/E2E/utils/getPromiseWithResolve';
import Navigation from '@libs/Navigation/Navigation';
import Performance from '@libs/Performance';
import CONST from '@src/CONST';
import ROUTES from '@src/ROUTES';

type ViewableItem = {
    reportActionID?: string;
};

type ViewableItemResponse = Array<{item?: ViewableItem}>;

const test = (config: NativeConfig) => {
    console.debug('[E2E] Logging in for comment linking');

    const reportID = getConfigValueOrThrow('reportID', config);
    const linkedReportActionID = getConfigValueOrThrow('linkedReportActionID', config);

    E2ELogin().then((neededLogin) => {
        if (neededLogin) {
            return waitForAppLoaded().then(() => E2EClient.submitTestDone());
        }

        const [appearMessagePromise, appearMessageResolve] = getPromiseWithResolve();
        const [switchReportPromise] = getPromiseWithResolve();

        Promise.all([appearMessagePromise, switchReportPromise])
            .then(() => {
                console.debug('[E2E] Test completed successfully, exiting…');
                E2EClient.submitTestDone();
            })
            .catch((err) => {
                console.debug('[E2E] Error while submitting test results:', err);
            });

        const subscription = DeviceEventEmitter.addListener('onViewableItemsChanged', (res: ViewableItemResponse) => {
            console.debug('[E2E] Viewable items retrieved, verifying correct message…', res);

            if (!!res && res?.at(0)?.item?.reportActionID === linkedReportActionID) {
                appearMessageResolve();
                subscription.remove();
            } else {
                console.debug(`[E2E] Provided message id '${res?.at(0)?.item?.reportActionID}' doesn't match to an expected '${linkedReportActionID}'. Waiting for a next one…`);
            }
        });

        Performance.subscribeToMeasurements((entry) => {
            if (entry.name === CONST.TIMING.SIDEBAR_LOADED) {
                console.debug('[E2E] Sidebar loaded, navigating to a report…');
                Navigation.navigate(ROUTES.REPORT_WITH_ID.getRoute(reportID));
                return;
            }
        });
    });
};

export default test;
