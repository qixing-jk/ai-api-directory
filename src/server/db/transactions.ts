export type TransactionContext<TClient> = {
  readonly db: TClient;
};

export type TransactionRunner<TClient> = <TResult>(
  operation: (context: TransactionContext<TClient>) => Promise<TResult>,
) => Promise<TResult>;
