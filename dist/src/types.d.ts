import * as github from "@actions/github";
export declare type Client = ReturnType<typeof github.getOctokit>;
export declare type ChangedFile = {
    sha: string;
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    blob_url: string;
    raw_url: string;
    contents_url: string;
    patch?: string | undefined;
    previous_filename?: string | undefined;
};
export declare type Config = {
    components: Component;
};
export declare type Component = {
    [path: string]: string[] | string;
};
//# sourceMappingURL=types.d.ts.map