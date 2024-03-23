interface Callback {
  (...argv: any): any;
}
// 将回调放入微任务队列
export function runMicroTask(callback: Callback) {
  // 判断是否为node环境
  if (typeof process !== "undefined" && process.nextTick) {
    // node环境使用nextTick模拟微任务
    // 实际上nextTick任务处于nextTick队列，在微队列前一个执行
    process.nextTick(callback);
  } else if (typeof MutationObserver !== "undefined") {
    // 浏览器环境使用MutationObserver将函数放入微队列
    // MutationObserver用于观察一个DOM节点的变动，当节点变动时会将回调放入微队列中。
    const element = document.createElement("div");
    const observer = new MutationObserver(callback);
    observer.observe(element, {
      attributes: true, // 观察属性变动
    });
    element.className = "";
  } else {
    // 保底使用setTimeout
    setTimeout(callback, 0);
  }
}

// 判断是否为对象
export function isObject(val: any) {
  return val !== null && (typeof val === "object" || typeof val === "function");
}

// 判断是否为Promise
export function isPromise(p: any) {
  return p instanceof Promise || (isObject(p) && typeof p.then === "function");
}

// 判断是否为函数
export function isFunction(val: any) {
  return typeof val === "function";
}

