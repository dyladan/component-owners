import * as github from "@actions/github";

export type Client = ReturnType<typeof github.getOctokit>;

export type ChangedFile = {
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

export type Config = {
    components: Component;
};

export type Component = {
    [path: string]: string[] | string;
};
