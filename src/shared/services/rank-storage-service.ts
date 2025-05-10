import { AddRankResponseModel } from "../models/add-rank-response";
import { RankStorageModel } from "../models/rank-storage";
export class RankStorageService {
    constructor() { };
    public addRank(rankStorageList: RankStorageModel[]): Promise<AddRankResponseModel[]> {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get('myranks', (data) => {
                if (!data.myranks) {
                    data.myranks = [];
                }
                const updatedRanks = [...data.myranks];
                var today = new Date().toISOString().split('T')[0];
                let addedResult: AddRankResponseModel[] = [];

                rankStorageList.forEach(newRank => {
                    var targetSite: RankStorageModel = updatedRanks.find(item => item.hostname.toLowerCase() === newRank.hostname.toLowerCase());

                    if (!targetSite) {
                        targetSite = { hostname: newRank.hostname, keyWords: [{ keyword: newRank.keyWords[0].keyword, rankHistory: [...newRank.keyWords[0].rankHistory] }] };
                        updatedRanks.push(targetSite);
                        addedResult.push({ added: true, item: targetSite });
                    } else {
                        var targetWithKeyword = targetSite.keyWords.find(kw => kw.keyword === newRank.keyWords[0].keyword);

                        if (targetWithKeyword) {
                            var todayRank = targetWithKeyword.rankHistory.find(rankHistory => rankHistory.date === today);
                            
                            if (!todayRank) {
                              targetWithKeyword.rankHistory.push({ date: today, rank: newRank.keyWords[0].rankHistory[0].rank });
                                addedResult.push({added:true,item:{hostname:newRank.hostname,keyWords:[targetWithKeyword]}});
                            } else {
                                addedResult.push({ added: false, item: {hostname:newRank.hostname,keyWords:[targetWithKeyword]}});
                            }
                        } else {
                            targetSite.keyWords.push({
                                keyword: newRank.keyWords[0].keyword,
                                rankHistory: [...newRank.keyWords[0].rankHistory]
                            });
                            addedResult.push({added:true,item:{hostname:newRank.hostname,keyWords:[{keyword:newRank.keyWords[0].keyword,rankHistory:newRank.keyWords[0].rankHistory}]}});
                        }
                    }
                });                
                chrome.storage.sync.set({ 'myranks': updatedRanks }, () => {
                    resolve(addedResult);
                });
            });
        });
    }
}