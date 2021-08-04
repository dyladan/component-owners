import { ChangedFile, Client, Config } from "./types";
export declare function getOwners(config: Config, changedFiles: ChangedFile[]): Promise<string[]>;
export declare function getRefs(): {
    base: string;
    head: string;
};
export declare function getChangedFiles(client: Client, base: string, head: string): Promise<ChangedFile[]>;
export declare function getConfig(client: Client, ref: string, location: string): Promise<Config>;
//# sourceMappingURL=utils.d.ts.map