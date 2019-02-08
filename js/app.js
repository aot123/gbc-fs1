// const API_KEY_TOKEN = '88NRNJF5CN9Y4H19WB25UD294HQKWS7IX1';
const API_KEY_TOKEN = 'test';
const INTERVAL = 7000;
const HOST_URL = 'https://api.etherscan.io/api';
const GET_LAST_BLOCK_URL = `${HOST_URL}?module=proxy&action=eth_blockNumber&apikey=${API_KEY_TOKEN}`;
const GET_BLOCK_BY_NO_URL = `${HOST_URL}?module=proxy&action=eth_getBlockByNumber&boolean=true&apikey=${API_KEY_TOKEN}&tag=`;
// const GET_BLOCK_TRANSACTION_COUNT_BY_NUMBER_URL = `${HOST_URL}?module=proxy&action=eth_getBlockTransactionCountByNumber&apikey=${API_KEY_TOKEN}&tag=`;
const GET_LAST_PRICE_URL = `${HOST_URL}?module=stats&action=ethprice&apikey=${API_KEY_TOKEN}`;

Dashboard = {
    lastPriceText: null,
    lastBlockNo: null,
    init: function () {
        $('[data-toggle="tooltip"]').tooltip();
        // $('.nav-tabs a[href="#overview"]').tab('show');
        $("#toggle-realtime").change(this.toggleRealTime);
        // build components for first time
        // Dashboard.startRealTime();
        // $("#toggle-realtime").trigger('change');
    },
    toggleRealTime: (function () {
        var _timer = null,
            _interval = INTERVAL;
        return function () {
            if ($(this).is(':checked')) {
                // enable realtime update...
                $('#label-switch').attr('data-original-title', '+Realtime Updates Enabled, Click to Disable');

                // if (_timer !== null) return;
                // _timer = setInterval(function () {
                //     Dashboard.startRealTime();
                // }, _interval);
                Dashboard.startRealTime();
            } else {
                // disable realtime update...
                $('#label-switch').attr('data-original-title', 'Realtime Updates Disabled, Click to Enable');

                clearInterval(_timer);
                _timer = null;
            }
        }
    })(),
    startRealTime: function () {
        this.buildBlueBox();
        $('#main-container').fadeIn(1000);
    },
    buildBlueBox: function () {
        let self = this;
        Utils.fetchData(GET_LAST_BLOCK_URL)
            .then(async function (data) {
                let currentBlockNo = data.result;
                if (self.lastBlockNo !== currentBlockNo) {
                    // update last block no
                    self.lastBlockNo = currentBlockNo;

                    // get prev block no
                    let prevBlockNo = '0x' + (currentBlockNo - 1).toString(16);
                    try {
                        let [currentBlock, prevBlock, lastPrice] = await Promise.all([
                            Utils.fetchData(GET_BLOCK_BY_NO_URL + currentBlockNo),
                            Utils.fetchData(GET_BLOCK_BY_NO_URL + prevBlockNo),
                            Utils.fetchData(GET_LAST_PRICE_URL)
                        ]);

                        self.displayLastPrice(lastPrice);
                        self.displayCurrentPercentage();
                        self.displayLastBlock(currentBlock, prevBlock);
                    }
                    catch (err) {
                        throw new Error('Something went wrong...\n' + err);
                    };
                }
            });
    },
    displayLastPrice: function (data) {
        // Utils.fetchData(GET_LAST_PRICE_URL)
        //     .then(data => {
        //         let currentPriceText = `$${data.result.ethusd} @ ${data.result.ethbtc}`;
        //         if (this.lastPriceText !== currentPriceText) {
        //             this.lastPriceText = currentPriceText;
        //             Utils.populateData('#price', currentPriceText);
        //         }
        //     });
        let currentPriceText = `$${data.result.ethusd} @ ${data.result.ethbtc}`;
        if (this.lastPriceText !== currentPriceText) {
            this.lastPriceText = currentPriceText;
            Utils.populateData('#price', currentPriceText);
        }
    },
    displayCurrentPercentage: function () {
        // b/c we cannot get enough info to calculate percentage, this function do the mock data only
        // get random percentage with maximum is 5%
        let percentage = (Math.random() * 5).toFixed(2);
        // get random number, if it's odd number then percentage goes down, otherwise percentage go up
        let isUp = (percentage * 100) % 2 === 0,
            caretClass = isUp ? 'up' : 'down',
            percentageHtml = `<i class='fa fa-caret-${caretClass}'></i><span class='${caretClass}'>${percentage}%</span>`;
        // update percentage of ether price
        Utils.populateData('#price-percent', percentageHtml);
    },
    displayLastBlock: function (currentBlock, prevBlock) {
        // Utils.fetchData(GET_LAST_BLOCK_URL)
        //     .then(data => {
        //         // convert block no from hex to decimal
        //         let currentBlockNo = parseInt(data.result, 16);
        //         if (this.lastBlockNo !== currentBlockNo) {
        //             this.lastBlockNo = currentBlockNo;
        //             Utils.populateData('#last-block', currentBlockNo);
        //         }
        //     });

        // convert block no from hex to decimal
        // and get time diff between latest block and prev one
        // and get total transactions of latest block
        let currentBlockNo = parseInt(currentBlock.result.number, 16),
            timeDiff = currentBlock.result.timestamp - prevBlock.result.timestamp,
            totalTxnsOfCurrentBlock = currentBlock.result.transactions.length;

        Utils.populateData('#last-block', currentBlockNo);
        Utils.populateData('#avg-block-time', `${timeDiff}s`);
        Utils.populateData('#transactions', totalTxnsOfCurrentBlock);
    }
};

Utils = {
    fetchData: function (url) {
        return fetch(url)
            .then(res => {
                if (res.ok) {
                    return res.json();
                }
                throw new Error('Api did not respond...');
            })
            .then(data => {
                console.log(data);
                return data;
            });
    },
    populateData: function (element, data) {
        $(element).fadeOut(0, function () {
            $(this).html(data).fadeIn(500);
        });
    }
};

$(function () {
    // var timer = null,
    //     interval = 1000,
    //     value = 0;

    // $("#toggle-realtime").change(function () {
    //     if ($(this).is(':checked')) {
    //         // Checkbox is checked..
    //         if (timer !== null) return;
    //         timer = setInterval(function () {
    //             console.log(++value);
    //         }, interval);
    //     } else {
    //         // Checkbox is not checked..
    //         clearInterval(timer);
    //         timer = null;
    //     }
    // });

    // $('#main-container').hide();
    Dashboard.init();
});
