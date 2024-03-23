function runMicroTask(callback) {
    if (typeof process !== "undefined" && process.nextTick) {
        process.nextTick(callback);
    }
    else if (typeof MutationObserver !== "undefined") {
        const element = document.createElement("div");
        const observer = new MutationObserver(callback);
        observer.observe(element, {
            attributes: true,
        });
        element.className = "";
    }
    else {
        setTimeout(callback, 0);
    }
}
function isObject(val) {
    return val !== null && (typeof val === "object" || typeof val === "function");
}
function isPromise(p) {
    return p instanceof Promise || (isObject(p) && typeof p.then === "function");
}
function isFunction(val) {
    return typeof val === "function";
}

var State;
(function (State) {
    State["pending"] = "pending";
    State["fulfilled"] = "fulfilled";
    State["rejected"] = "rejected";
})(State || (State = {}));
class QXPromise {
    state = State.pending;
    result;
    queue = [];
    constructor(executor) {
        try {
            executor(this.resolve, this.reject);
        }
        catch (error) {
            this.reject(error);
        }
    }
    resolve = (value) => {
        this.changeState(State.fulfilled, value);
    };
    reject = (reason) => {
        this.changeState(State.rejected, reason);
    };
    changeState(state, result) {
        if (this.state !== State.pending)
            return;
        this.state = state;
        this.result = result;
        this.runQueue();
    }
    pushQueue(state, fn, resolve, reject) {
        this.queue.push({ state, fn, resolve, reject });
    }
    runQueue() {
        if (this.state === State.pending)
            return;
        if (this.queue.length <= 0)
            return;
        while (this.queue.length) {
            this.runQueueItem(this.queue[0]);
            this.queue.shift();
        }
    }
    runQueueItem(item) {
        if (this.state !== item.state)
            return;
        runMicroTask(() => {
            if (!isFunction(item.fn)) {
                item.state === State.fulfilled
                    ? item.resolve(this.result)
                    : item.reject(this.result);
                return;
            }
            try {
                const { fn } = item;
                const res = fn(this.result);
                if (isPromise(res)) {
                    res.then(item.resolve, item.reject);
                    return;
                }
                item.resolve(res);
            }
            catch (error) {
                item.reject(error);
            }
        });
    }
    then(onFulfilled, onRejected) {
        return new QXPromise((resolve, reject) => {
            this.pushQueue(State.fulfilled, onFulfilled, resolve, reject);
            this.pushQueue(State.rejected, onRejected, resolve, reject);
            this.runQueue();
        });
    }
    catch(onRejected) {
        return this.then(undefined, onRejected);
    }
    finally(onFinally) {
        return this.then((value) => {
            onFinally();
            return value;
        }, (reason) => {
            onFinally();
            throw reason;
        });
    }
    static resolve(value) {
        if (value instanceof Promise)
            return value;
        return new QXPromise((resolve, reject) => {
            if (isPromise(value)) {
                value.then(resolve, reject);
            }
            else {
                resolve(value);
            }
        });
    }
    static reject(reason) {
        return new QXPromise((_, reject) => {
            reject(reason);
        });
    }
    static all(promises) {
        return new QXPromise((resolve, reject) => {
            try {
                const result = [];
                let count = 0;
                let fulfilledCount = 0;
                for (const p of promises) {
                    let index = count;
                    this.resolve(p).then((data) => {
                        result[index] = data;
                        fulfilledCount++;
                        if (fulfilledCount === count) {
                            resolve(result);
                        }
                    }, reject);
                    count++;
                }
                if (count === 0) {
                    resolve([]);
                }
            }
            catch (error) {
                reject(error);
            }
        });
    }
    static allSettled(promises) {
        const promiseList = [];
        for (const p of promises) {
            promiseList.push(this.resolve(p).then((value) => {
                return { status: State.fulfilled, value };
            }, (reason) => {
                return { status: State.rejected, reason };
            }));
        }
        return this.all(promiseList);
    }
    static race(promises) {
        return new QXPromise((resolve, reject) => {
            for (const p of promises) {
                this.resolve(p).then(resolve, reject);
            }
        });
    }
    get [Symbol.toStringTag]() {
        return this.constructor.name;
    }
}

export { QXPromise as default };
