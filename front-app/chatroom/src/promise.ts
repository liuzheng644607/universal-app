enum PromiseStatus {
  Pending = "Pending",
  Fulfilled = "Fulfilled",
  Rejected = "Rejected",
}

type PromiseValue<T> = T | PromiseLike<T>;

class PromiseA<T = unknown> {

  static resolve = <T>(value: T) => {
    return new PromiseA((resolve) => {
      resolve(value);
    });
  }

  static reject = (reason) => {
    return new PromiseA((resolve, reject) => {
      reject(reason);
    });
  }

  status = PromiseStatus.Pending;

  onrejectedCallback: Function[] = [];

  onfulfilledCallback: Function[] = [];

  value: PromiseValue<T> | null = null;

  reason = null;

  constructor(
    executor: (
      resolve: (value: PromiseValue<T>) => void,
      reject: (reason?: any) => void
    ) => void
  ) {

    const internalResolver = (data: T | PromiseLike<T>) => {
      this.status = PromiseStatus.Fulfilled;
      this.value = data;
      this.consumeOnfulfilledCallback();
    }

    const internalRejector = (reason) => {
      this.status = PromiseStatus.Rejected;
      this.reason = reason;
      this.consumeOnrejectedCallback();
    }
    executor(internalResolver, internalRejector)
  }

  private consumeOnrejectedCallback() {
    while (this.onrejectedCallback.length) {
      const fn = this.onrejectedCallback.shift();
      fn?.(this.reason);
    };
  }

  private consumeOnfulfilledCallback() {
    while (this.onfulfilledCallback.length) {
      const fn = this.onfulfilledCallback.shift();
      fn?.(this.value);
    };
  }

  then(onfulfilled, onrejected) {
    if (typeof onfulfilled === 'function') {
      this.onfulfilledCallback.push(onfulfilled);
    }
    if (typeof onrejected === 'function') {
      this.onrejectedCallback.push(onrejected);
    }

    if (this.status === PromiseStatus.Fulfilled) {
      this.consumeOnfulfilledCallback();
    }

    if (this.status === PromiseStatus.Rejected) {
      this.consumeOnrejectedCallback();
    }
  }
}


