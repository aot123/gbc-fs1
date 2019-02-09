const API_KEY_TOKEN = 'ACWZM8ZM91G1TJYABPQHE1281FEPJKGVD9';
const HOST_URL = 'https://api.etherscan.io/api';
const GET_LAST_BLOCK_URL = `${HOST_URL}?module=proxy&action=eth_blockNumber&apikey=${API_KEY_TOKEN}`;
const GET_BLOCK_BY_NO_URL = `${HOST_URL}?module=proxy&action=eth_getBlockByNumber&boolean=true&apikey=${API_KEY_TOKEN}&tag=`;
const GET_LAST_PRICE_URL = `${HOST_URL}?module=stats&action=ethprice&apikey=${API_KEY_TOKEN}`;
const INTERVAL = 7000;

Dashboard = {
    currentPriceText: null,
    currentBlockNo: null,
    prevBlockNo: null,
    nextBlockNo: null,
    blocks: {},
    init: function () {
        $('[data-toggle="tooltip"]').tooltip({
            trigger: 'hover'
        });

        $('#toggle-realtime').on('change', this.toggleRealTime);
        $('#last-block').on('click', $.proxy(this.viewBlockInfo, this));
        $('#block-navigation').on('click', $.proxy(this.navigateBlock, this));
        $('#close-block-info').on('click', function () {
            $('#block-info-container').hide();
        });
        // build components for first time
        this.startRealTime();
        $("#toggle-realtime").trigger('change');
    },
    toggleRealTime: (function () {
        var _timer = null,
            _interval = INTERVAL;
        return function () {
            if ($(this).is(':checked')) {
                // enable realtime update...
                $('#label-switch').attr('data-original-title', '+Realtime Updates Enabled, Click to Disable');

                if (_timer !== null) return;
                _timer = setInterval(function () {
                    Dashboard.startRealTime();
                }, _interval);
                // Dashboard.startRealTime();
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
                let lastBlockNo = data;
                if (self.currentBlockNo !== lastBlockNo) {
                    // update current block no
                    self.currentBlockNo = lastBlockNo;

                    // get prev block no
                    let prevBlockNo = Utils.getPrevBlockNo(lastBlockNo);
                    try {
                        let [currentBlock, prevBlock, lastPrice] = await Promise.all([
                            Utils.fetchData(GET_BLOCK_BY_NO_URL + lastBlockNo),
                            Utils.fetchData(GET_BLOCK_BY_NO_URL + prevBlockNo),
                            Utils.fetchData(GET_LAST_PRICE_URL)
                        ]);
                        // cache these blocks for viewing block info feature
                        self.blocks[lastBlockNo] = currentBlock;
                        // self.blocks[prevBlockNo] = prevBlock;
                        self.prevBlockNo = prevBlockNo;

                        // get time diff between latest block and prev one
                        // and store for using it later
                        currentBlock['timeDiff'] = currentBlock.timestamp - prevBlock.timestamp;

                        // update blue box's data
                        self.displayLastPrice(lastPrice);
                        self.displayCurrentPercentage();
                        self.displayLastBlock(currentBlock);
                    }
                    catch (err) {
                        throw new Error('Something went wrong...\n' + err);
                    }
                }
            });
    },
    displayLastPrice: function (data) {
        let lastPriceText = `$${data.ethusd} @ ${data.ethbtc}`;
        if (this.currentPriceText !== lastPriceText) {
            this.currentPriceText = lastPriceText;
            Utils.populateData('#price', lastPriceText);
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
    displayLastBlock: function (block) {
        // convert block no from hex to decimal
        // and get time diff between latest block and prev one
        // and get total transactions of latest block
        Utils.populateData('#last-block', Utils.hexToDecimal(block.number));
        Utils.populateData('#avg-block-time', `${block.timeDiff}s`);
        Utils.populateData('#transactions', block.transactions.length);
    },
    viewBlockInfo: function (e) {
        if (this.currentBlockNo) {
            let blockInfo = this.blocks[this.currentBlockNo];
            this.prevBlockNo = Utils.getPrevBlockNo(this.currentBlockNo);
            this.nextBlockNo = null;
            this.displayBlockInfo(blockInfo);
        }
    },
    displayBlockInfo: function (blockInfo) {
        if (blockInfo) {
            let minedAt = new Date(Utils.hexToDecimal(blockInfo.timestamp) * 1000),
                timestampStr = moment(minedAt).fromNow() + ' (' + moment(minedAt).format('MMM-DD-YYYY hh:mm:ss A Z') + ')',
                gasUsed = Utils.hexToDecimal(blockInfo.gasUsed),
                gasLimit = Utils.hexToDecimal(blockInfo.gasLimit),
                gasUsedPercentage = (100 * gasUsed / gasLimit).toFixed(2);

            Utils.populateData('#block-height', Utils.hexToDecimal(blockInfo.number));
            Utils.populateData('#block-timestamp', timestampStr);
            Utils.populateData('#block-transactions-no', blockInfo.transactions.length + ' transactions');
            Utils.populateData('#block-transactions-text', 'in this Block');
            Utils.populateData('#block-hash', blockInfo.hash);
            Utils.populateData('#block-parent-hash', blockInfo.parentHash);
            Utils.populateData('#block-sha3-uncles', blockInfo.sha3Uncles);
            Utils.populateData('#block-mined-by', blockInfo.miner);
            Utils.populateData('#block-mined-time', `in ${blockInfo.timeDiff} secs`);
            Utils.populateData('#block-difficulty', Utils.formatMoneyWithComma(Utils.hexToDecimal(blockInfo.difficulty)));
            Utils.populateData('#block-total-difficulty', Utils.formatMoneyWithComma(Utils.hexToDecimal(blockInfo.totalDifficulty)));
            Utils.populateData('#block-size', Utils.hexToDecimal(blockInfo.size) + ' bytes');
            Utils.populateData('#block-gas-used', `${gasUsed.toLocaleString('en')} (${gasUsedPercentage}%)`);
            Utils.populateData('#block-gas-limit', gasLimit.toLocaleString('en'));
            Utils.populateData('#block-nonce', blockInfo.nonce);
            Utils.populateData('#block-reward', blockInfo.timestamp);
            Utils.populateData('#block-uncles-reward', blockInfo.uncles.length);
            Utils.populateData('#block-extra-data', `nanopool.org (Hex: ${blockInfo.extraData})`);

            $('#prev-block-btn').data('block-no', this.prevBlockNo);
            $('#next-block-btn').data('block-no', this.nextBlockNo);
            if (this.nextBlockNo === null || this.nextBlockNo > this.currentBlockNo) {
                $('#next-block-btn').addClass('latest');
                $('#next-block-btn').attr('data-original-title', 'You have reached The Lastest Block');
            } else {
                $('#next-block-btn').removeClass('latest');
                $('#next-block-btn').attr('data-original-title', 'View Next Block');
            }

            if ($('#block-info-container').is(":hidden")) {
                $('#block-info-container').show();
            }
        }
    },
    getBlockInfo: async function (blockNo) {
        let blockInfo = this.blocks[blockNo],
            prevBlockNo = Utils.getPrevBlockNo(blockNo),
            nextBlockNo = Utils.getNextBlockNo(blockNo);
        if (blockInfo === undefined || blockInfo === null) {
            try {
                let _prevNo2 = Utils.getPrevBlockNo(prevBlockNo),
                    _prev = this.blocks[prevBlockNo],
                    _next = this.blocks[nextBlockNo],
                    _prev2 = this.blocks[_prevNo2];
                let [currentBlock, prevBlock, nextBlock, prevBlock2] = await Promise.all([
                    Utils.fetchData(GET_BLOCK_BY_NO_URL + blockNo),
                    _prev ? _prev : Utils.fetchData(GET_BLOCK_BY_NO_URL + prevBlockNo),
                    _next ? _next : Utils.fetchData(GET_BLOCK_BY_NO_URL + nextBlockNo),
                    _prev2 ? _prev2 : Utils.fetchData(GET_BLOCK_BY_NO_URL + _prevNo2)
                ]);

                // cache these blocks for viewing block info feature
                // get time diff between latest block and prev one
                // and store for using it later
                if (currentBlock) {
                    this.blocks[blockNo] = blockInfo = currentBlock;
                    currentBlock['timeDiff'] = currentBlock.timestamp - prevBlock.timestamp;
                }
                if (prevBlock && _prev === null) {
                    this.blocks[prevBlockNo] = prevBlock;
                    prevBlock['timeDiff'] = prevBlock.timestamp - prevBlock2.timestamp;
                }
                if (nextBlock && _next === null) {
                    this.blocks[nextBlockNo] = nextBlock;
                    nextBlock['timeDiff'] = nextBlock.timestamp - currentBlock.timestamp;
                }
            }
            catch (err) {
                throw new Error('Something went wrong...\n' + err);
            }
        }
        return blockInfo;
    },
    navigateBlock: function (e) {
        let $target = $(e.target);
        if ($target.hasClass('navigation-btn')) {
            let blockNo = $target.data('block-no');
            if (blockNo > this.currentBlockNo) {
                return;
            }
            if (blockNo) {
                this.getBlockInfo(blockNo).then((block) => {
                    if (block) {
                        this.prevBlockNo = Utils.getPrevBlockNo(blockNo);
                        this.nextBlockNo = Utils.getNextBlockNo(blockNo);
                        this.displayBlockInfo(block);
                    }
                });
            }
        }
        e.stopPropagation();
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
                console.log(data.result);
                return data.result;
            });
    },
    populateData: function (element, data) {
        $(element).fadeOut(0, function () {
            $(this).html(data).fadeIn(500);
        });
    },
    hexToDecimal: function (number) {
        return parseInt(number, 16);
    },
    decimalToHex: function (number) {
        return '0x' + (number).toString(16);
    },
    formatMoneyWithComma: function (amount) {
        return amount.toLocaleString('en');
    },
    getNextBlockNo(blockNo) {
        return Utils.decimalToHex(Utils.hexToDecimal(blockNo) + 1);
    },
    getPrevBlockNo(blockNo) {
        return Utils.decimalToHex(Utils.hexToDecimal(blockNo) - 1);
    }
};

$(function () {
    // $('#main-container').hide();
    Dashboard.init();
});
