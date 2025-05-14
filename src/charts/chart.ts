import "./chart.scss"
import Chart from 'chart.js/auto';
import { RankStorageModel } from "../shared/models/rank-storage";
let rankChartInstance: Chart | null = null;
// after opening the tab it will fill the selector with sorted ranks hostnames
document.addEventListener('DOMContentLoaded', () => {
    const siteSelector = document.getElementById('siteSelector') as HTMLSelectElement | null;
    if (!siteSelector) return;
    chrome.storage.sync.get("myranks", data => {
        const ranks: RankStorageModel[] = data.myranks || [];
        ranks.forEach((rank) => {
            const option = document.createElement('option');
            if (!rank.hostname) return;
            option.value = rank.hostname;
            option.textContent = rank.hostname;
            siteSelector.appendChild(option);
        })
        const sampleData=sampleDataForChart();
        drawChart(sampleData,"future","your");
        if(ranks.length<1){
            alert("Oops! Nothing to show yet. Try searching a few keywords to see who’s ruling Google! 🚀");
        }
    })
})

$('#siteSelector').on('change', function () {
    const hostname = String($(this).val() || '');
    chrome.storage.sync.get("myranks", data => {
        const mySites: RankStorageModel[] = data.myranks || [];
        const targetSite = mySites.find(site => site.hostname.toLowerCase() === hostname.toLowerCase());
        if (targetSite) {
            $('#keyWordSelector').find('option:not(:disabled)').remove();
            if (targetSite.keyWords) {
                targetSite.keyWords.forEach((kw) => {
                    $('#keyWordSelector').append(`<option value="${kw.keyword}">${kw.keyword}</option>`);
                })
                $('#keyWordSelector').show();
            }
        }
    })
});
function sampleDataForChart(): { date: string; rank: number }[] {
    const sampleData: { date: string; rank: number }[] = [];
    let date = new Date();



    for (let i = 100; i >= 1; i--) {

        date = new Date(date.toISOString().split("T")[0]);
        sampleData.push({ date: date.toDateString().split("T")[0], rank: i })
        date.setDate(date.getDate() + 1);
    }
    return sampleData;
}

$('#keyWordSelector').on('change', function () {
    const selectKwString = String($(this).val() || '');
    const selectSite = String($('#siteSelector').val() || '');
    if (selectKwString.length >= 1) {
        chrome.storage.sync.get("myranks", data => {
            const mysites: RankStorageModel[] = data.myranks || [];
            const targetSite = mysites.find((site) => site.hostname.toLowerCase() === selectSite.toLowerCase());
            const targetKw = targetSite?.keyWords.find((kw) => kw.keyword === selectKwString);
            if (targetKw)
                drawChart(targetKw.rankHistory, targetKw?.keyword, selectSite);
        })
    }
})
function drawChart(
    rankHistory: { date: string; rank: number }[],
    keyword: string,
    hostname: string) {
    const ctx = document.getElementById('rankChart') as HTMLCanvasElement;

    if (rankChartInstance) {
        rankChartInstance.destroy();
    }

    const labels = rankHistory.map(item => item.date);
    const data = rankHistory.map(item => item.rank);

    rankChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${hostname} - ${keyword}`,
                data: data,
                borderColor: '#C34D49',
                tension: 0.3,
                fill: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    reverse: true,
                    title: {
                        display: true,
                        text: 'Rank'
                    }, ticks: {
                        stepSize: 1,
                        precision: 0

                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });
}