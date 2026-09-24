import { k8sCoreV1Api } from "./config.js";
import { assertSandboxId } from "./validation.js";

export const createService = async (sandboxId, projectId) => {
    assertSandboxId(sandboxId);
    const labels = {
        app: 'sandbox',
        sandboxId: sandboxId
    };
    if (projectId) {
        labels.projectId = String(projectId);
    }
    const serviceManifest = {
        metadata: {
            name: `sandbox-service-${sandboxId}`,
            labels
        },
        spec: {
            selector: {
                app: 'sandbox',
                sandboxId: sandboxId
            },
            ports: [
                {
                    name: "http",
                    port: 80,
                    targetPort: 5173,
                    protocol: "TCP"
                },
                {
                    name: "agent-http",
                    port: 3000,
                    targetPort: 3000,
                    protocol: "TCP"
                }
            ],
            type: "ClusterIP"
        }
    }

    const response = await k8sCoreV1Api.createNamespacedService({
        namespace: 'default',
        body: serviceManifest
    })

    return response;
}

export async function deleteService(sandboxId) {
    const response = await k8sCoreV1Api.deleteNamespacedService({
        namespace: 'default',
        name: `sandbox-service-${sandboxId}`
    })

    return response;
}