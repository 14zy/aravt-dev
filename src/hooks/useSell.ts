import { useEffect, useState } from "react";
import { Sell } from "../wrappers/Sell"; // Adjust the import path as necessary
import { useTonClient } from "./useTonClient";
import { Address, OpenedContract } from "@ton/core";

export function useSell() {
    const client = useTonClient();
    const [sell, setSell] = useState<OpenedContract<Sell> | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initSell = async () => {
            if (!client) return;

            try {
                const sellAddress = Address.parse(import.meta.env.VITE_TOKEN_SELL_ADDRESS as string); // Use the environment variable
                const sell = await client.open(await Sell.fromAddress(sellAddress));
                setSell(sell);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Unknown error";
                setError("Failed to initialize Sell: " + message);
            }
        };

        initSell();
    }, [client]);

    return { sell, error };
}
