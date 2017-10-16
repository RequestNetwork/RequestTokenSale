"use strict";
//Credit to https://github.com/b9lab/play-with-time/blob/master/utils/evmFunctions.js
module.exports = function(web3) {
    web3.evm = web3.evm ? web3.evm : {};

    if (typeof web3.evm.snapshot === "undefined") {
        /**
         * @param {!function} callback - Node-type callback: error, hex number as string.
         */
        web3.evm.snapshot = function(callback) {
            web3.currentProvider.sendAsync(
                {
                    jsonrpc: "2.0",
                    method: "evm_snapshot",
                    params: [],
                    id: new Date().getTime()
                },
                (error, result) => callback(error, error ? result : result.result));
        };
    }

    if (typeof web3.evm.revert === "undefined") {
        /**
         * @param {!number} snapshotId. The snapshot to revert.
         * @param {!function} callback - Node-type callback: error, boolean.
         */
        web3.evm.revert = function(snapshotId, callback) {
            web3.currentProvider.sendAsync(
                {
                    jsonrpc: "2.0",
                    method: "evm_revert",
                    params: [ snapshotId ],
                    id: new Date().getTime()
                },
                (error, result) => callback(error, error ? result : result.result));
        };
    }

    if (typeof web3.evm.increaseTime === "undefined") {
        /**
         * @param {!number} offset. Time in milliseconds by which to advance the EVM.
         * @param {!function} callback - Node-type callback: error, cumulative increase since start.
         */
        web3.evm.increaseTime = function(offset, callback) {
            web3.currentProvider.sendAsync(
                {
                    jsonrpc: "2.0",
                    method: "evm_increaseTime",
                    params: [ offset ],
                    id: new Date().getTime()
                },
                (error, result) => callback(error, error ? result : result.result));
        };
    }

    if (typeof web3.evm.mine === "undefined") {
        /**
         * @param {!function} callback - Node-type callback: error only.
         */
        web3.evm.mine = function(callback) {
            web3.currentProvider.sendAsync(
                {
                    jsonrpc: "2.0",
                    method: "evm_mine",
                    params: [],
                    id: new Date().getTime()
                },
                (error, result) => callback(error, error ? result : result.result));
        };
    }
};
