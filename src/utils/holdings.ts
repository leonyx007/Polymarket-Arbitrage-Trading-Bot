import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { logger } from "./logger";

export interface TokenHoldings {
    [marketId: string]: {
        [tokenId: string]: number;
    };
}

const HOLDINGS_FILE = resolve(process.cwd(), "src/data/token-holding.json");

export function loadHoldings(): TokenHoldings {
    if (!existsSync(HOLDINGS_FILE)) {
        return {};
    }

    try {
        const content = readFileSync(HOLDINGS_FILE, "utf-8");
        return JSON.parse(content) as TokenHoldings;
    } catch (error) {
        logger.error("Failed to load holdings", error);
        return {};
    }
}

export function saveHoldings(holdings: TokenHoldings): void {
    try {
        writeFileSync(HOLDINGS_FILE, JSON.stringify(holdings, null, 2));
    } catch (error) {
        logger.error("Failed to save holdings", error);
    }
}

export function addHoldings(marketId: string, tokenId: string, amount: number): void {
    const holdings = loadHoldings();
    
    if (!holdings[marketId]) {
        holdings[marketId] = {};
    }
    
    if (!holdings[marketId][tokenId]) {
        holdings[marketId][tokenId] = 0;
    }
    
    holdings[marketId][tokenId] += amount;
    
    saveHoldings(holdings);
    logger.info(`Added ${amount} tokens to holdings: ${marketId} -> ${tokenId}`);
}

export function getHoldings(marketId: string, tokenId: string): number {
    const holdings = loadHoldings();
    return holdings[marketId]?.[tokenId] || 0;
}

export function removeHoldings(marketId: string, tokenId: string, amount: number): void {
    const holdings = loadHoldings();
    
    if (!holdings[marketId] || !holdings[marketId][tokenId]) {
        logger.warn(`No holdings found for ${marketId} -> ${tokenId}`);
        return;
    }
    
    const currentAmount = holdings[marketId][tokenId];
    const newAmount = Math.max(0, currentAmount - amount);
    
    if (newAmount === 0) {
        delete holdings[marketId][tokenId];
        // Clean up empty market entries
        if (Object.keys(holdings[marketId]).length === 0) {
            delete holdings[marketId];
        }
    } else {
        holdings[marketId][tokenId] = newAmount;
    }
    
    saveHoldings(holdings);
    logger.info(`Removed ${amount} tokens from holdings: ${marketId} -> ${tokenId} (remaining: ${newAmount})`);
}

export function getMarketHoldings(marketId: string): { [tokenId: string]: number } {
    const holdings = loadHoldings();
    return holdings[marketId] || {};
}

export function getAllHoldings(): TokenHoldings {
    return loadHoldings();
}

export function clearMarketHoldings(marketId: string): void {
    const holdings = loadHoldings();
    if (holdings[marketId]) {
        delete holdings[marketId];
        saveHoldings(holdings);
        logger.info(`Cleared holdings for market: ${marketId}`);
    } else {
        logger.warn(`No holdings found for market: ${marketId}`);
    }
}

export function clearHoldings(): void {
    saveHoldings({});
    logger.info("All holdings cleared");
}

