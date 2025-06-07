import { AddRankResponseModel } from "../models/add-rank-response";
import { RankStorageModel } from "../models/rank-storage";
import { SiteStorageModel } from "../models/site-storage";
import { SerpHelper } from "../helpers/serp-helper";
import { CommonHelper } from "../helpers/common-helper";

export class RankStorageService {
    private serpHelper = new SerpHelper();
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
                                addedResult.push({ added: true, item: { hostname: newRank.hostname, keyWords: [targetWithKeyword] } });
                            } else {
                                addedResult.push({ added: false, item: { hostname: newRank.hostname, keyWords: [targetWithKeyword] } });
                            }
                        } else {
                            targetSite.keyWords.push({
                                keyword: newRank.keyWords[0].keyword,
                                rankHistory: [...newRank.keyWords[0].rankHistory]
                            });
                            addedResult.push({ added: true, item: { hostname: newRank.hostname, keyWords: [{ keyword: newRank.keyWords[0].keyword, rankHistory: newRank.keyWords[0].rankHistory }] } });
                        }
                    }
                });
                chrome.storage.sync.set({ 'myranks': updatedRanks }, () => {
                    resolve(addedResult);
                });
            });
        });
    }
    public removeRanks(name: string): void {
        chrome.storage.sync.get('myranks', (data) => {
            const mySites: RankStorageModel[] = data.myranks || [];

            var targetSite = mySites.find(site => site.hostname === name);
            if (targetSite) {
                var index = data.myranks.indexOf(targetSite);
                data.myranks.splice(index, 1);
            }
            chrome.storage.sync.set({ 'myranks': data.myranks });
        })
    }
    public findRanks(resultItems: Element[], keyword: any): Promise<RankStorageModel[]> {
        return new Promise((resolve, reject) => {
            var rankStorageList: RankStorageModel[] = [];
            chrome.storage.sync.get('mysites', (data) => {
                if (data.mysites && data.mysites.length > 0) {
                    const mysites: SiteStorageModel[] = data.mysites;
                    const today = new Date().toISOString().split("T")[0];
                    // return if the keyword is null or undefined
                    if (!keyword)
                        return;
                    for (let i = 0; i < resultItems.length; i++) {
                        let url = this.serpHelper.getLinkFromResultItem(resultItems[i]);
                        let domain = CommonHelper.getDomainNameFromUrl(url);
                        const targetSite = mysites.find(site => site.hostname.toLowerCase() === domain.toLowerCase())
                        if (targetSite) {
                            if (!rankStorageList.find(item => item.hostname.toLowerCase() === targetSite.hostname.toLowerCase())) {
                                rankStorageList.push({ hostname: domain, keyWords: [{ keyword: keyword, rankHistory: [{ date: today, rank: i + 1 }] }] })
                            }
                        }
                    }
                }
            })
            resolve(rankStorageList);
        })
    }
}