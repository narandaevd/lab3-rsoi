export async function retry<TData>(requestCallback: () => Promise<TData>, maxAttempts: number): Promise<TData> {
  let currentAttempts = 0;
  let returnData: TData;
  let error: Error;
  let success = false;
  while (currentAttempts < maxAttempts && !success) {
    await requestCallback().then((data) => {
      success = true;
      returnData = data;
    }).catch(err => {
      currentAttempts++;
      console.log('STARTED RETRIES, current', currentAttempts);
      success = false;
      error = err;
    });
  }
  if (!success)
    throw error;
  return returnData;
}
