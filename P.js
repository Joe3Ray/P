/**
 * @author  JoeRay61
 * @email   joeray199261@gmail.com
 * @file    P.js
 * @description
 *     A Javascript Promise library.
 */

'use strict';

function P() {
    /**
     * Promise对象的状态
     * 枚举型，取值分别为
     *     pending: 执行中
     *     fulfilled: 执行成功
     *     rejected: 执行失败
     * @type {string}
     */
    /* eslint-disable fecs-camelcase */
    var _state = 'pending';

    /**
     * 执行成功后的回调函数队列
     *
     * @type {Array}
     */
    var _onFulfills = [];

    /**
     * 执行失败后的回调函数队列
     *
     * @type {Array}
     */
    var _onRejects = [];

    /**
     * 执行结束后的返回值
     */
    var _value;

    /**
     * 设置promise状态
     * 如果promise的状态不为pending，则执行对应的回调函数
     *
     * @param  {string} state 状态
     * @param  {dynamic} value promise执行完成的返回值
     */
    function _set(state, value) {
        if (state !== 'pending') {
            _state = state;
            _value = value;

            var handlers = state === 'fulfilled' ? _onFulfills : _onRejects;
            handlers.forEach(function (fn) {
                if (typeof fn === 'function') {
                    fn(value);
                }
            });

            _onFulfills = null;
            _onRejects = null;
        }
    }
    /* eslint-enable fecs-camelcase */

    this.resolve = function (value) {
        _set('fulfilled', value);
    };

    this.reject = function (value) {
        _set('rejected', value);
    };

    this.done = function (onFulfill, onReject) {
        if (_state === 'pending') {
            _onFulfills.push(onFulfill);
            _onRejects.push(onReject);
        }
        else {
            if (_state === 'fulfilled') {
                if (typeof onFulfill === 'function') {
                    onFulfill(_value);
                }
            }
            else if (typeof onReject === 'function') {
                onReject(_value);
            }
        }
    };
}

/**
 * Promise的then方法
 *
 * @param  {Function} onFulfill Promise对象执行成功后的回调
 * @param  {Function} onReject  Promise对象执行失败后的回调
 *
 * @return {Object}           新的Promise对象
 */
P.prototype.then = function (onFulfill, onReject) {
    var p = new P();

    this.done(function (x) {
        if (typeof onFulfill === 'function') {
            try {
                handlePromise(p, onFulfill(x));
            }
            catch (e) {
                p.reject(e);
            }
        }
        else {
            p.resolve(x);
        }
    }, function (x) {
        if (typeof onReject === 'function') {
            try {
                handlePromise(p, onReject(x));
            }
            catch (e) {
                p.reject(e);
            }
        }
        else {
            p.reject(x);
        }
    });

    return p;
};

/**
 * 捕获promise的失败状况
 *
 * @param  {Function} onReject promise失败时触发的回调
 */
P.prototype.catch = function (onReject) {
    return this.then(null, onReject);
};

/**
 * P类的静态方法all，可传入多个promise控制的函数，全部函数执行完后会触发then
 *
 * @return {Object} promise对象
 */
P.all = function () {
    var p = new P();

    var total = arguments.length;
    var finishedNum = 0;
    var results = [];

    var promises = Array.prototype.slice.call(arguments, 0);
    promises.forEach(function (promise, i) {
        promise.done(function (val) {
            results[i] = val;
            finishedNum++;
            if (finishedNum === total) {
                p.resolve(results);
            }
        }, function (e) {
            p.reject('function ' + i + ' fail');
        });
    });

    return p;
};

/**
 * P类的静态方法any，可传入多个promise控制的函数，任意一个函数执行完后会触发then
 *
 * @return {Object} promise对象
 */
P.any = function () {
    var p = new P();

    var finished = false;

    var total = arguments.length;

    var failNum = 0;

    var results = new Array(total);

    var promises = Array.prototype.slice.call(arguments, 0);
    promises.forEach(function (promise, i) {
        promise.done(function (val) {
            if (!finished) {
                finished = true;
                results[i] = val;
                p.resolve(results);
            }
        }, function () {
            failNum++;
            if (failNum === total) {
                p.reject(new TypeError('all fail'));
            }
        });
    });

    return p;
};

/**
 * promise处理函数，遵循promise/a+规范
 *
 * @param  {Object} promise Promise对象
 * @param  {dynamic} value   上一个promise的执行结果
 *
 * @return {undefined}
 */
function handlePromise(promise, value) {
    if (promise === value) {
        return promise.reject(new TypeError('this promise is equal to the value'));
    }

    if (value instanceof P) {
        value.done(function (x) {
            promise.resolve(x);
        }, function (x) {
            promise.reject(x);
        });
    }
    else if (typeof value === 'function' || typeof value === 'object') {
        var called = false;

        var then;

        try {
            then = value.then;

            if (typeof then === 'function') {
                then.call(value, function (x) {
                    if (!called) {
                        called = true;
                        handlePromise(promise, x);
                    }
                }, function (x) {
                    if (!called) {
                        called =  true;
                        promise.reject(x);
                    }
                });
            }
            else {
                promise.resolve(value);
            }
        }
        catch (e) {
            if (!called) {
                called = true;
                promise.reject(e);
            }
        }
    }
    else {
        promise.resolve(value);
    }
}

module.exports = P;
