/* eslint-disable rulesdir/no-negated-variables */
import type {RouteProp} from '@react-navigation/native';
import type {ComponentType, ForwardedRef, RefAttributes} from 'react';
import React, {useCallback, useEffect} from 'react';
import {withOnyx} from 'react-native-onyx';
import type {OnyxCollection, OnyxEntry, WithOnyxInstanceState} from 'react-native-onyx';
import FullscreenLoadingIndicator from '@components/FullscreenLoadingIndicator';
import useWindowDimensions from '@hooks/useWindowDimensions';
import getComponentDisplayName from '@libs/getComponentDisplayName';
import * as ReportUtils from '@libs/ReportUtils';
import NotFoundPage from '@pages/ErrorPage/NotFoundPage';
import * as Report from '@userActions/Report';
import ONYXKEYS from '@src/ONYXKEYS';
import type * as OnyxTypes from '@src/types/onyx';
import {isEmptyObject} from '@src/types/utils/EmptyObject';

type OnyxPropsParentReportAction = {
    /** The report's parentReportAction */
    parentReportAction: OnyxEntry<OnyxTypes.ReportAction>;
};

type OnyxPropsWithoutParentReportAction = {
    /** The report currently being looked at */
    report: OnyxEntry<OnyxTypes.Report>;

    /** The report metadata */
    reportMetadata: OnyxEntry<OnyxTypes.ReportMetadata>;

    /** Array of report actions for this report */
    reportActions: OnyxEntry<OnyxTypes.ReportActions>;

    /** The policies which the user has access to */
    policies: OnyxCollection<OnyxTypes.Policy>;

    /** Beta features list */
    betas: OnyxEntry<OnyxTypes.Beta[]>;

    /** Indicated whether the report data is loading */
    isLoadingReportData: OnyxEntry<boolean>;
};

type ComponentPropsWithoutParentReportAction = OnyxPropsWithoutParentReportAction & {
    route: RouteProp<{params: {reportID: string; reportActionID: string}}>;
};

type ComponentProps = OnyxPropsParentReportAction & ComponentPropsWithoutParentReportAction;

export default function <TProps extends ComponentProps, TRef>(
    WrappedComponent: ComponentType<TProps & RefAttributes<TRef>>,
): ComponentType<Omit<Omit<TProps, keyof OnyxPropsParentReportAction> & RefAttributes<TRef>, keyof OnyxPropsWithoutParentReportAction>> {
    function WithReportOrNotFound(props: TProps, ref: ForwardedRef<TRef>) {
        const {isSmallScreenWidth} = useWindowDimensions();
        const getReportAction = useCallback(() => {
            let reportAction: OnyxTypes.ReportAction | Record<string, never> | undefined = props.reportActions?.[`${props.route.params.reportActionID}`];

            // Handle threads if needed
            if (!reportAction?.reportActionID) {
                reportAction = props?.parentReportAction ?? {};
            }

            return reportAction;
        }, [props.reportActions, props.route.params.reportActionID, props.parentReportAction]);

        const reportAction = getReportAction();

        // For small screen, we don't call openReport API when we go to a sub report page by deeplink
        // So we need to call openReport here for small screen
        useEffect(() => {
            if (!isSmallScreenWidth || (!isEmptyObject(props.report) && !isEmptyObject(reportAction))) {
                return;
            }
            Report.openReport(props.route.params.reportID);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isSmallScreenWidth, props.route.params.reportID]);

        // Perform all the loading checks
        const isLoadingReport = props.isLoadingReportData && !props.report?.reportID;
        const isLoadingReportAction = isEmptyObject(props.reportActions) || (props.reportMetadata?.isLoadingInitialReportActions && isEmptyObject(getReportAction()));
        const shouldHideReport = !isLoadingReport && (!props.report?.reportID || !ReportUtils.canAccessReport(props.report, props.policies, props.betas));

        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        if ((isLoadingReport || isLoadingReportAction) && !shouldHideReport) {
            return <FullscreenLoadingIndicator />;
        }

        // Perform the access/not found checks
        if (shouldHideReport || isEmptyObject(reportAction)) {
            return <NotFoundPage />;
        }

        return (
            <WrappedComponent
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
                ref={ref}
            />
        );
    }

    WithReportOrNotFound.displayName = `withReportOrNotFound(${getComponentDisplayName(WrappedComponent)})`;

    return withOnyx<Omit<TProps, keyof OnyxPropsParentReportAction> & RefAttributes<TRef>, OnyxPropsWithoutParentReportAction>({
        report: {
            key: ({route}) => `${ONYXKEYS.COLLECTION.REPORT}${route.params.reportID}`,
        },
        reportMetadata: {
            key: ({route}) => `${ONYXKEYS.COLLECTION.REPORT_METADATA}${route.params.reportID}`,
        },
        reportActions: {
            key: ({route}) => `${ONYXKEYS.COLLECTION.REPORT_ACTIONS}${route.params.reportID}`,
            canEvict: false,
        },
        betas: {
            key: ONYXKEYS.BETAS,
        },
        policies: {
            key: ONYXKEYS.COLLECTION.POLICY,
        },
        isLoadingReportData: {
            key: ONYXKEYS.IS_LOADING_REPORT_DATA,
        },
    })(
        withOnyx<TProps & RefAttributes<TRef>, OnyxPropsParentReportAction>({
            parentReportAction: {
                key: (props) => `${ONYXKEYS.COLLECTION.REPORT_ACTIONS}${props?.report?.parentReportID ?? 0}`,
                selector: (parentReportActions: OnyxEntry<OnyxTypes.ReportActions>, props: WithOnyxInstanceState<OnyxPropsParentReportAction>): OnyxEntry<OnyxTypes.ReportAction> => {
                    const parentReportActionID = props?.report?.parentReportActionID;
                    if (!parentReportActionID) {
                        return null;
                    }
                    return parentReportActions?.[parentReportActionID] ?? null;
                },
                canEvict: false,
            },
        })(React.forwardRef(WithReportOrNotFound)),
    );
}
