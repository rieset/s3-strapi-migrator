import { Document } from 'bson';
export declare class Migrator {
    private readonly ycAccessKeyId;
    private readonly ycSecretAccessKey;
    private readonly ycBucketName;
    private readonly mongoUri;
    private readonly mongoDbName;
    private readonly mongoCollectionName;
    private readonly ycS3;
    private currentList;
    private client;
    private db;
    constructor();
    prepare(): Promise<void>;
    getClient(): Promise<any>;
    connect(name: any): Promise<Document>;
    process(): Promise<boolean>;
    components(): Promise<void>;
    private componetsList;
    articles(): Promise<void>;
    private checkField;
    moveFile(fileRecord: any): Promise<any>;
    getFile(file: any): Promise<any>;
    linkFinder(content: string): RegExpMatchArray | never[];
}
