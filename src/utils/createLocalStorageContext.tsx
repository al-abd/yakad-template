"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
    type Dispatch,
    type SetStateAction,
} from "react";

export function createLocalStorageContext<T extends object>(
    storageKey: string,
    defaultValue: T
) {
    const contextName =
        storageKey.charAt(0).toUpperCase() +
        storageKey
            .slice(1)
            .replace(/([A-Z])/g, " $1")
            .trim()
            .replace(/ /g, "");

    type ContextType = {
        [K in Lowercase<typeof contextName>]: T;
    } & {
        [K in `set${Capitalize<typeof contextName>}`]: Dispatch<
            SetStateAction<T>
        >;
    };

    // This helps TypeScript infer the exact string literal type from contextName
    const contextNameLower = contextName.toLowerCase() as Lowercase<
        typeof contextName
    >;

    const LocalContext = createContext<ContextType | undefined>(undefined);
    LocalContext.displayName = contextName;

    const Provider = ({ children }: { children: ReactNode }) => {
        const [state, setState] = useState<T>(defaultValue);

        const contextValue = {
            [contextNameLower]: state,
            [`set${contextName}`]: setState,
        } as ContextType;

        useEffect(() => {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored) as T;
                    setState((prev) => ({
                        ...prev,
                        ...parsed,
                    }));
                } catch (error) {
                    console.error(
                        `Failed to parse ${contextName} from localStorage`,
                        error
                    );
                }
            }
        }, []);

        useEffect(() => {
            localStorage.setItem(storageKey, JSON.stringify(state));
        }, [state]);

        return (
            <LocalContext.Provider value={contextValue}>
                {children}
            </LocalContext.Provider>
        );
    };

    const useValue = (): ContextType => {
        const context = useContext(LocalContext);
        if (context === undefined) {
            throw new Error(
                `use${contextName} must be used within a ${contextName}Provider`
            );
        }
        return context;
    };

    return [Provider, useValue] as const;
}
