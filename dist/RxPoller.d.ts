/**
 * Interface for RxPoller configuration options.
 */
export interface IRxPollerConfig {
    /**
     * Default polling rate.
     */
    interval?: number;
    /**
     * Maximum rate allowed when exponentially backing off.
     */
    maxInterval?: number;
}
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
export declare class RxPoller {
    private static _pollers;
    /**
     * A private cached function to be called for each iteration of the poller.
     * @returns Must return a promise.
     */
    private _action;
    /**
     * A subject which presents the current paused status.
     */
    private _pauser$;
    /**
     * A Disposable instance for an active poller. This is set
     * when a poller is started via .connect(). To disconnect a poller,
     * you would run .dispose() on this.
     */
    private _connection;
    /**
     * A subject which presents the number of errors since the last success.
     */
    private _errorCount$;
    /**
     * A subject which presents the current default polling interval.
     */
    private _interval$;
    /**
     * A subject which presents the maximum polling interval.
     *
     * When a poll action (Promise) fails, or is rejected,
     * we will exponentially back off the interval until the max is reached.
     */
    private _maxInterval$;
    /**
     * An Observable which presents the active polling delay between each iteration of the poller.
     *
     * When errors occur, this method will take that into account and exponentially back off the next interval.
     */
    private _computedInterval$;
    /**
     * A ConnectableObservable which is a "hot observable" for the poller action.
     * This is what gets subscribed to by consumers of this class.
     */
    private _poller$;
    /**
     * Creates a new instance of RxPoller.
     *
     * @param name A name for the poller which can be used to retrieve it later.
     * @param config Configuration options for RxPoller.
     */
    constructor(name: string, config: IRxPollerConfig);
    /**
     * Cache method used when creating a poller.
     * Enforces unique names.
     *
     * @param name The desired name for a new poller.
     * @param instance New poller instance to be cached.
     */
    static setPoller(name: string, instance: RxPoller): void;
    /**
     * Retrieve a cached poller by name.
     *
     * @param name The name which was used to register a poller.
     */
    static getPoller(name: string): RxPoller;
    /**
     * Supply a function to be called for each iteration of the poller.
     *
     * @param fn Action function to be called for each iteration of the poller. This method should return a Promise.
     */
    setAction(fn: any): void;
    /**
     * Update configuration options.
     */
    setConfig(config: IRxPollerConfig): void;
    /**
     * Subscribe to a poller observable with a callback.
     *
     * @param cb Function to be called with the results of each interation of the poller.
     */
    subscribe(cb: any): void;
    /**
     * Start a poller instance.
     *
     * @param forceStart Begin polling immediately or wait one interval period before the first action.
     */
    start(forceStart: boolean): void;
    /**
     * Stop a poller instance.
     */
    stop(): void;
}
