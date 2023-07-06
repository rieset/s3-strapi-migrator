export declare class Heater {
    private readonly crawler;
    private readonly generator;
    private errorsCounter;
    constructor(url: string);
    process(): Promise<unknown>;
    errorHandler(error: any): Promise<void>;
}
