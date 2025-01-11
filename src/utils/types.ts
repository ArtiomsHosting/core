export interface ExpressManagerParams {
    port: number;
}

export interface UpdateManagerParams {
    repository: string;
    branch?: string;
    autoUpdate: boolean;
    authToken?: string;
    updateCheckInterval: number;
    remoteName?: string;
}
