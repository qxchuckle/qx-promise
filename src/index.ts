import { runMicroTask, isPromise, isFunction } from "./utils/index";

// 执行器
interface Executor<T = any> {
  (resolve: Resolve<T>, reject: Reject): void;
}
// resolve
interface Resolve<T = any> {
  (value?: T): void;
}
// reject
interface Reject {
  (reason?: any): void;
}
// A+规范then方法参数
interface OnFulfilled<T, R = T> {
  (value: T): R | QXPromise<R> | null | undefined;
}
interface OnRejected<T = any, R = T> {
  (reason: T): R | QXPromise<R> | null | undefined;
}
// 任务队列元素
interface QueueItem<T> {
  state: State;
  fn: OnFulfilled<T> | OnRejected | undefined | null;
  resolve: Resolve;
  reject: Reject;
}
// allSettled返回结果类型
interface AllSettledResult<T> {
  status: State.fulfilled | State.rejected;
  value?: T;
  reason?: any;
}
type AllSettledResolveResult<T> = Required<
  Pick<AllSettledResult<T>, "status" | "value">
>;
type AllSettledRejectResult = Required<
  Pick<AllSettledResult<never>, "status" | "reason">
>;

// 状态枚举
enum State {
  pending = "pending",
  fulfilled = "fulfilled",
  rejected = "rejected",
}

// 手写Promise
export default class QXPromise<T = any> {
  // 状态
  private state: State = State.pending;
  // 结果
  private result?: T;
  // 队列
  private queue: Array<QueueItem<T>> = [];

  constructor(executor: Executor<T>) {
    // 捕获执行器抛出的错误，改为reject状态
    try {
      executor(this.resolve, this.reject);
    } catch (error: any) {
      this.reject(error);
    }
  }

  // 任务完成
  private resolve: Resolve<T> = (value) => {
    this.changeState(State.fulfilled, value);
  };

  // 任务失败
  private reject: Reject = (reason) => {
    this.changeState(State.rejected, reason);
  };

  // 改变状态
  private changeState(state: State, result?: T) {
    // 只允许从pending状态改变一次
    if (this.state !== State.pending) return;
    this.state = state;
    this.result = result;
    // console.log(this);
    // 状态改变时执行队列
    this.runQueue();
  }

  // 向队列中添加任务
  private pushQueue(
    state: State,
    fn: OnFulfilled<T> | OnRejected | undefined | null,
    resolve: Resolve,
    reject: Reject
  ) {
    this.queue.push({ state, fn, resolve, reject });
  }

  // 执行队列
  private runQueue() {
    if (this.state === State.pending) return;
    if (this.queue.length <= 0) return;
    // console.log(this.queue);
    // 队列尾进头出
    while (this.queue.length) {
      this.runQueueItem(this.queue[0]);
      this.queue.shift();
    }
  }

  // 执行队列中的任务
  private runQueueItem(item: QueueItem<T>) {
    // 状态不一致时不执行
    if (this.state !== item.state) return;
    // 将任务放入微任务队列
    runMicroTask(() => {
      // 如果任务不是函数，进行穿透
      if (!isFunction(item.fn)) {
        item.state === State.fulfilled
          ? item.resolve(this.result)
          : item.reject(this.result);
        return;
      }
      // 执行任务函数
      try {
        // 解构出函数，使this指向不改变。
        const { fn } = item;
        const res = fn!(this.result!);
        // 判断返回值是否为Promise
        if (isPromise(res)) {
          // 等待Promise状态改变，再执行完成或失败
          res.then(item.resolve, item.reject);
          return;
        }
        item.resolve(res);
      } catch (error: any) {
        // console.log(error);
        item.reject(error);
      }
    });
  }

  // then方法
  public then<R1 = T, R2 = never>(
    onFulfilled?: OnFulfilled<T, R1>,
    onRejected?: OnRejected<T, R2>
  ) {
    return new QXPromise<R1 | R2>((resolve, reject) => {
      // 将then方法的回调放入队列，未来执行
      // 现在不用考虑fn是否是可执行函数，因为在执行队列时会判断。不是函数会进行穿透。
      this.pushQueue(State.fulfilled, onFulfilled, resolve, reject);
      this.pushQueue(State.rejected, onRejected, resolve, reject);
      // 若状态已改变，立即执行队列
      // 因为then可能在状态改变以后又被调用。
      this.runQueue();
    });
  }

  // catch方法，本质就是then方法
  public catch(onRejected: OnRejected): QXPromise {
    return this.then(undefined, onRejected);
  }

  // finally方法，本质也是then方法
  public finally(onFinally: () => void): QXPromise {
    // 无论状态如何，都会执行finally回调
    return this.then(
      (value) => {
        onFinally();
        // 返回值不变，继续传递resolve状态
        return value;
      },
      (reason) => {
        onFinally();
        // 抛出错误，继续传递reject状态
        throw reason;
      }
    );
  }

  // 静态resolve方法
  static resolve<T>(value?: T | QXPromise<T> | PromiseLike<T>): QXPromise<T>{
    // 如果是ES6-Promise实例，直接返回
    if (value instanceof Promise) return value as QXPromise<T>;
    return new QXPromise((resolve, reject) => {
      if (isPromise(value)) {
        // 如果是PromiseLike，等待状态改变
        (value as QXPromise<T>).then(resolve, reject);
      } else {
        // 直接resolve值
        resolve(value as T);
      }
    });
  }

  // 静态reject方法
  static reject(reason?: any): QXPromise {
    return new QXPromise((_, reject) => {
      reject(reason);
    });
  }

  // 静态all方法
  static all<T>(promises: Iterable<T | QXPromise<T> | PromiseLike<T>>) {
    return new QXPromise<T[]>((resolve, reject) => {
      try {
        const result: T[] = [];
        let count = 0; // 总数计数
        let fulfilledCount = 0; // Promise完成计数
        for (const p of promises) {
          let index = count; // 记录当前Promise的索引
          this.resolve(p).then((data) => {
            // 将结果放入对应索引的位置
            result[index] = data;
            // 完成计数+1
            fulfilledCount++;
            // 所有Promise完成后，resolve结果
            if (fulfilledCount === count) {
              resolve(result);
            }
          }, reject);
          count++;
        }
        if (count === 0) {
          // 如果传入空数组，直接resolve空数组
          resolve([]);
        }
      } catch (error) {
        // 捕获错误，直接reject
        reject(error);
      }
    });
  }

  // 静态allSettled方法
  static allSettled<T>(promises: Iterable<T | QXPromise<T> | PromiseLike<T>>) {
    // 保存加工后的Promises
    const promiseList: Array<any> = [];
    // 对每个Promise进行加工
    for (const p of promises) {
      promiseList.push(
        // 让每个Promise都变成始终成功返回Result的Promise
        this.resolve(p).then(
          (value): AllSettledResolveResult<T> => {
            return { status: State.fulfilled, value };
          },
          (reason): AllSettledRejectResult => {
            return { status: State.rejected, reason };
          }
        )
      );
    }
    // 使用all方法，等待所有Promise完成，返回Result类型成功结果
    return this.all<AllSettledResult<T>>(promiseList);
  }

  // 静态race方法
  static race<T>(promises: Iterable<T | QXPromise<T> | PromiseLike<T>>) {
    return new QXPromise<T>((resolve, reject) => {
      for (const p of promises) {
        // 只要有一个Promise状态改变，就立即改变
        this.resolve(p).then(resolve, reject);
      }
    });
  }

  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
}
