import { resolve } from "path";
import { readFileSync, existsSync } from "fs";
import { Chain, ClobClient } from "@polymarket/clob-client";
import type { ApiKeyCreds } from "@polymarket/clob-client";
import { Wallet } from "@ethersproject/wallet";
import { config } from "../config";

let cachedClient: ClobClient | null = null;
let cachedConfig: { chainId: number; host: string } | null = null;

export async function getClobClient(): Promise<ClobClient> {
    const credentialPath = resolve(process.cwd(), "src/data/credential.json");
    
    if (!existsSync(credentialPath)) {
        throw new Error("Credential file not found. Run createCredential() first.");
    }

    const creds: ApiKeyCreds = JSON.parse(readFileSync(credentialPath, "utf-8"));
    
    const chainId = (config.chainId || Chain.POLYGON) as Chain;
    const host = config.clobApiUrl;

    if (cachedClient && cachedConfig && 
        cachedConfig.chainId === chainId && 
        cachedConfig.host === host) {
        return cachedClient;
    }

    const privateKey = config.requirePrivateKey();
    const wallet = new Wallet(privateKey);

    const secretBase64 = creds.secret.replace(/-/g, '+').replace(/_/g, '/');

    const apiKeyCreds: ApiKeyCreds = {
        key: creds.key,
        secret: secretBase64,
        passphrase: creds.passphrase,
    };

    cachedClient = new ClobClient(host, chainId, wallet, apiKeyCreds);
    cachedConfig = { chainId, host };

    return cachedClient;
}

export function clearClobClientCache(): void {
    cachedClient = null;
    cachedConfig = null;
}