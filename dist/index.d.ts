interface Executor<T = any> {
    (resolve: Resolve<T>, reject: Reject): void;
}
interface Resolve<T = any> {
    (value?: T): void;
}
interface Reject {
    (reason?: any): void;
}
interface OnFulfilled<T, R = T> {
    (value: T): R | QXPromise<R> | null | undefined;
}
interface OnRejected<T = any, R = T> {
    (reason: T): R | QXPromise<R> | null | undefined;
}
interface AllSettledResult<T> {
    status: State.fulfilled | State.rejected;
    value?: T;
    reason?: any;
}
declare enum State {
    pending = "pending",
    fulfilled = "fulfilled",
    rejected = "rejected"
}
declare class QXPromise<T = any> {
    private state;
    private result?;
    private queue;
    constructor(executor: Executor<T>);
    private resolve;
    private reject;
    private changeState;
    private pushQueue;
    private runQueue;
    private runQueueItem;
    then<R1 = T, R2 = never>(onFulfilled?: OnFulfilled<T, R1>, onRejected?: OnRejected<T, R2>): QXPromise<R1 | R2>;
    catch(onRejected: OnRejected): QXPromise;
    finally(onFinally: () => void): QXPromise;
    static resolve<T>(value?: T | QXPromise<T> | PromiseLike<T>): QXPromise<T>;
    static reject(reason?: any): QXPromise;
    static all<T>(promises: Iterable<T | QXPromise<T> | PromiseLike<T>>): QXPromise<T[]>;
    static allSettled<T>(promises: Iterable<T | QXPromise<T> | PromiseLike<T>>): QXPromise<AllSettledResult<T>[]>;
    static race<T>(promises: Iterable<T | QXPromise<T> | PromiseLike<T>>): QXPromise<T>;
    get [Symbol.toStringTag](): string;
}

export { QXPromise as default };
