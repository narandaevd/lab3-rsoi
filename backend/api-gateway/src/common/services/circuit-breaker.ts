export class CircuitBreaker {
  constructor(params: {
    maxAttempts: number;
    intervalInMs: number;
    pingCallback: () => Promise<void>;
  }) {
    this.state = 'closed';
    this.maxAttempts = params.maxAttempts;
    this.intervalInMs = params.intervalInMs;
    this.currentAttempts = 0;
    this.pingCallback = params.pingCallback;
  }

  private pingCallback: () => Promise<void>;

  private interval: NodeJS.Timeout;
  private intervalInMs: number;

  onOpened() {
    console.log('(onOpened) CB OPENED');
    this.interval = setInterval(() => {
      this.pingCallback()
        .then(() => {
          this.state = 'closed';
          this.onClosed();
        })
        .catch(() => {
          console.log('FAILED PING');
        });
    }, this.intervalInMs);
  }

  onClosed() {
    clearInterval(this.interval);
    this.currentAttempts = 0;
    console.log('(onClosed) CB CLOSED!');
  }

  async try<TData>(requestCallback: () => Promise<TData>) {
    let returnData: TData;
    let error: Error;
    let success = false;
    if (this.state === 'opened') {
      throw new Error('CB OPENED!');
    }
    while (this.currentAttempts < this.maxAttempts && this.state === 'closed' && !success) {
      await requestCallback().then((data) => {
        success = true;
        returnData = data;
        this.currentAttempts = 0;
      }).catch(err => {
        if (err.code !== 'ECONNREFUSED') {
          success = true;
          this.currentAttempts = 0;
          throw err;
        }
        this.currentAttempts++;
        console.log('STARTED RETRIES, current', this.currentAttempts);
        success = false;
        error = err;
      });
    }
    if (!success && this.state === 'closed') {
      this.state = 'opened';
      this.onOpened();
      throw error;
    }
    return returnData;
  }

  private state: 'opened' | 'closed';
  private currentAttempts: number;
  private maxAttempts: number;
}
