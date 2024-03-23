import QXPromise from './dist/index.esm.js';

// 测试race
QXPromise.race([QXPromise.reject(1), QXPromise.resolve(2)])
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log("err", err);
  });

// 测试allSettled
QXPromise.allSettled([1, 2, QXPromise.reject(3)]).then((res) => {
  res.forEach((item) => {
    console.log(item);
  });
});

// 测试all方法
const pp = new QXPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(0);
  }, 1000);
});
QXPromise.all([pp, 1, 2, 3])
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });

// 基本测试
const p = new QXPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(1);
  }, 1000);
})
  .then((res) => {
    console.log(res);
    return 2;
  })
  .then((res) => {
    console.log(res);
  });

/* 测试 */
const p1 = new QXPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(2);
  }, 1000);
});

p1.then(
  function (res) {
    console.log(this, res);
    // 测试返回Promise
    return new QXPromise((resolve, reject) => {
      setTimeout(() => {
        resolve("a");
      }, 500);
    });
  },
  (err) => {
    console.log(err);
  }
).then(
  (res) => {
    console.log(res);
  },
  (err) => {
    console.log(err);
  }
);

setTimeout(() => {
  p1.then((res) => {
    // 测试抛出错误
    throw 123;
  }).then(
    (res) => {
      console.log(res);
    },
    (err) => {
      console.log("err:", err);
    }
  );
}, 2000);

// 与 ES6-Promise 互操作
const p2 = new QXPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(2);
  }, 2000);
});

p2.then((res) => {
  console.log(res);
  return Promise.resolve("b");
})
  .then((res) => {
    console.log(res);
    return new QXPromise((resolve, reject) => {
      setTimeout(() => {
        resolve("c");
      }, 500);
    });
  })
  .then((res) => {
    console.log(res);
    return Promise.reject("d");
  })
  .then(
    () => {},
    (err) => {
      console.log(err);
    }
  );

// 兼容await
function delay(duration) {
  return new QXPromise((resolve) => {
    setTimeout(resolve, duration);
  });
}
(async () => {
  console.log("start");
  await delay(3000);
  console.log("end");
})();

// 测试catch
const p3 = new QXPromise((resolve, reject) => {
  setTimeout(() => {
    reject("error!!!");
  }, 500);
}).catch((err) => {
  console.log(err);
});

// 测试finally
const p4 = new QXPromise((resolve, reject) => {
  setTimeout(() => {
    resolve("ok");
  }, 500);
})
  .finally(() => {
    console.log("finally");
  })
  .finally(() => {
    console.log("finally");
  })
  .then((res) => {
    console.log("after finally:", res);
  })
  .finally(() => {
    console.log("finally");
    throw "finally error";
  })
  .catch((err) => {
    console.log("error:", err);
  });

// 静态resolve、reject方法
const p5 = QXPromise.resolve("resolve");
p5.then((res) => {
  console.log(res);
});
QXPromise.resolve(Promise.resolve("es6 resolve")).then((res) => {
  console.log(res);
});
QXPromise.resolve(Promise.reject("reject es6 resolve")).catch((res) => {
  console.log(res);
});
QXPromise.resolve(QXPromise.reject("my reject")).catch((res) => {
  console.log(res);
});
const p6 = QXPromise.reject("reject");
p6.catch((err) => {
  console.log(err);
});