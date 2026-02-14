const PREFIX = "[Terraform AI]";

export const terraformLog = {
  info: (message: string, data?: unknown) => {
    console.log(`${PREFIX} ${message}`, data ?? "");
  },
  error: (message: string, error?: unknown) => {
    console.error(`${PREFIX} ${message}`, error ?? "");
  },
  timing: (label: string, startMs: number) => {
    const elapsed = Date.now() - startMs;
    console.log(`${PREFIX} ${label} completed in ${elapsed}ms`);
  },
};
