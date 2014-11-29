/**
 * @file nfect.test.js
 * test harness for nfect.js
 * @author curtis zimmerman
 * @contact curtis.zimmerman@gmail.com
 * @license GPLv3
 * @version 0.0.1a
 */

module.exports = exports = __test = (function() {
	"use strict";
	var nfect = require('../nfect.js');
	var expect = require('chai').expect;

	describe('#NFECT', function() {
		describe('add', function() {
			it('should equal true', function() {
				expect(true).to.equal(true);
			});
		});
		describe('bind', function() {
			it('should create the specified pubsub event', function() {
				nfect.on('/unittest/on', function() {
					return true;
				});
				expect(nfect.fire('/unittest/on')).to.equal(true);
			});
		});
		describe('build', function() {
			it('should equal true', function() {
				expect(true).to.equal(true);
			});
		});
		describe('config', function() {
			it('should equal true', function() {
				expect(true).to.equal(true);
			});
		});
		describe('fire', function() {
			it('should execute the callback handler with the specified arguments', function() {
				nfect.on('/unittest/fire', function( test ) {
					expect(test).to.equal(true);
				});
				nfect.fire('/unittest/fire', [true]);
			});
		});
		describe('header', function() {
			it('should equal true', function() {
				expect(true).to.equal(true);
			});
		});
		describe('go', function() {
			it('should equal true', function() {
				expect(true).to.equal(true);
			});
		});
		describe('on', function() {
			it('should create the specified pubsub event', function() {
				nfect.on('/unittest/on', function() {
					return true;
				});
				expect(nfect.fire('/unittest/on')).to.equal(true);
			});
		});
	});
})();