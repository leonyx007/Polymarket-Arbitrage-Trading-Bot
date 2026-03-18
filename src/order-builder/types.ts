import { Side, OrderType, UserMarketOrder, CreateOrderOptions } from "@polymarket/clob-client";
import type { TradePayload } from "../utils/types";


export interface CopyTradeOptions {
    trade: TradePayload;

    sizeMultiplier?: number;

    maxAmount?: number;

    orderType?: OrderType.FOK | OrderType.FAK;

    tickSize?: CreateOrderOptions["tickSize"];

    negRisk?: boolean;

    feeRateBps?: number;
}

export interface CopyTradeResult {
    success: boolean;

    orderID?: string;

    error?: string;

    transactionHashes?: string[];

    marketOrder?: UserMarketOrder;
}

export interface IEvent {   
    id: string;
    ticker: string;
    slug: string;
    title: string;
    description: string;
    resolutionSource: string;
    startDate: string;
    creationDate: string;
    endDate: string;
    image: string;
    icon: string;
    active: boolean;
    closed: boolean;
    archived: boolean;
    new: boolean;
    featured: boolean;
    restricted: boolean;
    liquidity: number;
    volume: number;
    openInterest: number;
    createdAt: string;
    updatedAt: string;
    competitive: number;
    volume24hr: number;
    volume1wk: number;
    volume1mo: number;
    volume1yr: number;
    enableOrderBook: boolean;
    liquidityClob: number;
    negRisk: boolean;
    commentCount: number;
    cyom: boolean;
    showAllOutcomes: boolean;
    seriesSlug: string;
    negRiskAugmented: boolean;
    pendingDeployment: boolean;
    deploying: boolean;
    requiresTranslation: boolean;
}

export interface IMarketResponse {
    id: string;
    question: string;
    conditionId: string;
    slug: string;
    resolutionSource: string;
    endDate: string;
    liquidity: string;
    startDate: string;
    image: string;
    icon: string;
    description: string;
    outcomes: string;
    outcomePrices: string;
    volume: string;
    active: boolean;
    closed: boolean;
    marketMakerAddress: string;
    createdAt: string;
    updatedAt: string;
    new: boolean;
    featured: boolean;
    archived: boolean;
    restricted: boolean;
    groupItemThreshold: string;
    questionID: string;
    enableOrderBook: boolean;
    orderPriceMinTickSize: number;
    orderMinSize: number;
    volumeNum: number;
    liquidityNum: number;
    endDateIso: string;
    startDateIso: string;
    hasReviewedDates: boolean;
    volume24hr: number;
    volume1wk: number;
    volume1mo: number;
    volume1yr: number;
    clobTokenIds: string[];
    volume24hrClob: number;
    volume1wkClob: number;
    volume1moClob: number;
    volume1yrClob: number;
    volumeClob: number;
    liquidityClob: number;
    acceptingOrders: boolean;
    negRisk: boolean;
    events: IEvent[];
    ready: boolean;
    funded: boolean;
    acceptingOrdersTimestamp: string;
    cyom: boolean;
    competitive: number;
    pagerDutyNotificationEnabled: boolean;
    approved: boolean;
    rewardsMinSize: number;
    rewardsMaxSpread: number;
    clearBookOnStart: boolean;
    showGmpSeries: boolean;
    showGmpOutcome: boolean;
    manualActivation: boolean;
    negRiskOther: boolean;
    umaResolutionStatuses: string;
    pendingDeployment: boolean;
    deploying: boolean;
    rfqEnabled: boolean;
    eventStartTime: string;
    holdingRewardsEnabled: boolean;
    feesEnabled: boolean;
    requiresTranslation: boolean;
}


