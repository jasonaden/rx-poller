"use strict";
var rx_1 = require('rx');
/**
 * RxPoller
 * ========
 *
 * RxPoller is an Observable poller built with RxJS.
 *
 *
 * Goals
 * -----
 *
 * * Pollers must have a unique name
 * * Interval and Action can be set or changed at any time via setConfig and setAction
 * * Poller can be paused and restarted
 * * Pollers can be retrieved by name via RxPoller.getPoller('posts')
 * * Poller will exponentially backoff on errors, doubling the interval until maxInterval is reached.
 * * Pollers do not start counting the next interval until the prior promise has been resolved.
 *
 * Instantiation:
 * --------------
 *
 * ```
 * poller = new RxPoller('posts');
 * poller.setConfig({
 *   interval: 5000,
 *   maxInterval: 40000
 * });
 * ```
 *
 * But since configuration can also be passed in the constructor,
 * the above code could also be written as:
 *
 * ```
 * poller = new RxPoller('posts', {
 *   interval: 5000,
 *   maxInterval: 40000
 * });
 * ```
 *
 * Setting Poller Action:
 * ----------------------
 *
 * ```
 * poller.setAction(function(){
 *   return $http.get('/api/posts');
 * });
 * ```
 *
 * Subscribing to Poller for Callback
 * ----------------------------------
 *
 * ```
 * poller.subscribe(function(posts){
 *   // send array of posts to app
 * });
 * ```
 *
 * Starting and Stopping
 * ---------------------
 *
 * ```
 * poller.start()
 * poller.stop()
 * ```
 *
 * References
 * ----------
 *
 * Built with [RxJS v4.x](https://github.com/Reactive-Extensions/RxJS)
 *
 * [Egghead Intro to Reactive Programming](https://egghead.io/series/introduction-to-reactive-programming)
 *
 * [Egghead Step-by-Step Async JavaScript with RxJS](https://egghead.io/series/step-by-step-async-javascript-with-rxjs)
 *
 */
var RxPoller = (function () {
    /**
     * Creates a new instance of RxPoller.
     *
     * @param name A name for the poller which can be used to retrieve it later.
     * @param config Configuration options for RxPoller.
     */
    function RxPoller(name, config) {
        var _this = this;
        /**
         * A subject which presents the current paused status.
         */
        this._pauser$ = new rx_1.Subject();
        /**
         * A Disposable instance for an active poller. This is set
         * when a poller is started via .connect(). To disconnect a poller,
         * you would run .dispose() on this.
         */
        this._connection = rx_1.Disposable.create(Rx.helpers.noop);
        /**
         * A subject which presents the number of errors since the last success.
         */
        this._errorCount$ = new rx_1.BehaviorSubject(0);
        /**
         * A subject which presents the current default polling interval.
         */
        // Subject for interval
        this._interval$ = new rx_1.BehaviorSubject(0);
        /**
         * A subject which presents the maximum polling interval.
         *
         * When a poll action (Promise) fails, or is rejected,
         * we will exponentially back off the interval until the max is reached.
         */
        this._maxInterval$ = new rx_1.BehaviorSubject(0);
        /**
         * An Observable which presents the active polling delay between each iteration of the poller.
         *
         * When errors occur, this method will take that into account and exponentially back off the next interval.
         */
        this._computedInterval$ = this._interval$
            .zip(this._errorCount$, this._maxInterval$, function (interval, errorCnt, maxInterval) {
            var calInt = interval * Math.pow(2, errorCnt);
            return Math.min(calInt, maxInterval);
        });
        /**
         * A ConnectableObservable which is a "hot observable" for the poller action.
         * This is what gets subscribed to by consumers of this class.
         */
        this._poller$ = rx_1.Observable.fromPromise(function () { return _this._action(); })
            .repeatWhen(function (n) { return n
            .do(function (_) { return _this._errorCount$.onNext(0); })
            .flatMap(function (_) { return _this._computedInterval$; })
            .flatMap(function (interval) { return rx_1.Observable.timer(interval); }); })
            .retryWhen(function (err) { return err
            .do(function (err) { return _this._errorCount$.onNext(_this._errorCount$.getValue() + 1); })
            .flatMap(function (_) { return _this._computedInterval$; })
            .flatMap(function (interval) { return rx_1.Observable.timer(interval); }); })
            .publish();
        this.setConfig(config);
        this._name = name;
        RxPoller.setPoller(name, this);
        return this;
    }
    /**
     * Cache method used when creating a poller.
     * Enforces unique names.
     *
     * @param name The desired name for a new poller.
     * @param instance New poller instance to be cached.
     */
    RxPoller.setPoller = function (name, instance) {
        var curr = this._pollers.get(name);
        if (curr)
            throw "Cannot cache two RxPollers with the same name.";
        this._pollers.set(name, instance);
    };
    /**
     * Retrieve a cached poller by name.
     *
     * @param name The name which was used to register a poller.
     */
    RxPoller.getPoller = function (name) {
        return this._pollers.get(name);
    };
    /**
     * Supply a function to be called for each iteration of the poller.
     *
     * @param fn Action function to be called for each iteration of the poller. This method should return a Promise.
     */
    RxPoller.prototype.setAction = function (fn) {
        this._action = function () { return fn(); };
        return this;
    };
    /**
     * Update configuration options.
     */
    RxPoller.prototype.setConfig = function (config) {
        this._interval$.onNext(config.interval || this._interval$.getValue() || 8000);
        this._maxInterval$.onNext(config.maxInterval || this._maxInterval$.getValue() || 300000);
        return this;
    };
    /**
     * Subscribe to a poller observable with a callback.
     *
     * @param cb Function to be called with the results of each interation of the poller.
     */
    RxPoller.prototype.subscribe = function (cb) {
        this._poller$.subscribe(cb);
        return this;
    };
    /**
     * Start a poller instance.
     *
     * @param forceStart Begin polling immediately or wait one interval period before the first action.
     */
    RxPoller.prototype.start = function (forceStart) {
        var _this = this;
        rx_1.Observable.timer(forceStart ? 0 : this._interval$.getValue()).subscribe(function (_) {
            _this._connection = _this._poller$.connect();
        });
        return this;
    };
    /**
     * Stop a poller instance.
     */
    RxPoller.prototype.stop = function () {
        this._connection.dispose();
    };
    RxPoller.prototype.destroy = function () {
        this.stop();
        RxPoller.removePoller(this._name);
    };
    RxPoller.removePoller = function (name) {
        delete this._pollers[name];
    };
    RxPoller._pollers = new Map();
    return RxPoller;
}());
exports.RxPoller = RxPoller;
//# sourceMappingURL=RxPoller.js.map