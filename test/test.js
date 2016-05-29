/**
 * @file 测试用例
 * @author  JoeRay61
 * @email   joeray199261@gmail.com
 */

var assert = require('assert');
var P = require('../P');

function async(str, time, success) {
    var p = new P();
    setTimeout(function () {
        success ? p.resolve(str + '*') : p.reject(str + '-');
    }, time);
    return p;
}

describe('P', function () {
    describe('#resolve', function () {
        it('should return 123*', function () {
            return async(123, 100, true).then(function (val) {
                assert.equal('123*', val);
            });
        });
    });

    describe('#reject', function () {
        it('should return 123-', function () {
            return async(123, 100, false).then(null, function (val) {
                assert.equal('123-', val);
            });
        });
    });

    describe('#then', function () {
        it('should return 5', function () {
            return async(123, 100, true).then(function () {
                return 5;
            }).then(function (val) {
                assert.equal(5, val);
            });
        });
        it('should return 6', function () {
            return async(123, 100, false).then(null, function () {
                return 6;
            }).then(function (val) {
                assert.equal(6, val);
            });
        });
        it('should return 678*', function () {
            return async(123, 100, true).then(function () {
                return async(678, 100, true);
            }).then(function (val) {
                assert.equal('678*', val);
            });
        });
        it('should return {then: 3}', function () {
            return async(123, 100, true).then(function () {
                return {then: 3};
            }).then(function (val) {
                assert.deepEqual({then: 3}, val);
            });
        });
    });

    describe('#catch', function () {
        it('should return 123-', function () {
            return async(123, 100, false).then().catch(function (val) {
                assert.equal('123-', val);
            });
        });
    });

    describe('#all', function () {
        it('should return 123* and 456*', function () {
            return P.all(async(123, 100, true), async(456, 100, true)).then(function (res) {
                assert.deepEqual(['123*', '456*'], res);
            });
        });
        it('should reject', function () {
            return P.all(async(123, 100, true), async(456, 100, false)).then(null, function (val) {
                assert.equal('function 1 fail', val);
            });
        });
    });

    describe('#any', function () {
        it('should return 456*', function () {
            return P.any(async(123, 200, false), async(456, 100, true)).then(function (res) {
                assert.deepEqual([, '456*'], res);
            });
        });
        it('should reject', function () {
            return P.any(async(123, 100, false), async(456, 100, false)).then(null, function (val) {
                assert.equal('object', typeof val);
            });
        });
    });
});
