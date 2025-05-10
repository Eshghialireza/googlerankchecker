export class RankStorageModel{
    hostname:string;
    keyWords:{keyword:string,rankHistory:{date:string,rank:number} []} [];
}