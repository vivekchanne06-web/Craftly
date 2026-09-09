const SANDBOX_ID = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function assertSandboxId(sandboxId) {
    if (typeof sandboxId !== "string" || !SANDBOX_ID.test(sandboxId)) {
        throw new Error(`Invalid sandbox ID: ${sandboxId}`);
    }
}
