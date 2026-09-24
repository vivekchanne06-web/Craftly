import { k8sCoreV1Api } from "./config.js";
import { assertSandboxId } from "./validation.js";


export async function createPod(sandboxId, projectId) {
    assertSandboxId(sandboxId);

    const podManifest = {
        metadata: {
            name: `sandbox-pod-${sandboxId}`,
            labels: {
                app: "sandbox",
                sandboxId: sandboxId,
                projectId: String(projectId)
            }
        },
        spec: {
            volumes: [
                {
                    name: "workspace-volume",
                    emptyDir: {}
                }
            ],
            initContainers: [
                {
                    name: "init-container",
                    image: "template",
                    imagePullPolicy: "IfNotPresent",
                    command: ["sh", "-c", "cp -r /workspace/. /seed/"],
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/seed"
                        }
                    ]
                },
                {
                    name: "init-restore",
                    image: "sync-agent",
                    imagePullPolicy: "IfNotPresent",
                    command: ["node", "-e", `
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const projectId = process.env.PROJECT_ID;
const bucketName = 'cohort2-craftly-bucket';
const localDir = '/workspace';

(async () => {
    try {
        console.log('init-restore: Checking S3 for project:', projectId);
        const list = await s3.send(new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: projectId + '/'
        }));
        const files = list.Contents || [];
        if (files.length === 0) {
            console.log('init-restore: No existing files in S3. Using template seed.');
            process.exit(0);
        }
        console.log('init-restore: Found', files.length, 'files in S3. Restoring...');
        for (const file of files) {
            if (file.Key.endsWith('/')) continue;
            const res = await s3.send(new GetObjectCommand({
                Bucket: bucketName,
                Key: file.Key
            }));
            const relativePath = file.Key.replace(projectId + '/', '');
            const localPath = path.join(localDir, relativePath);
            fs.mkdirSync(path.dirname(localPath), { recursive: true });
            const data = await res.Body.transformToByteArray();
            fs.writeFileSync(localPath, Buffer.from(data));
            console.log('init-restore: Restored', relativePath);
        }
        console.log('init-restore: All files restored successfully.');
    } catch (err) {
        console.error('init-restore error:', err.message);
    }
    process.exit(0);
})();
`],
                    env: [
                        { name: "PROJECT_ID", value: String(projectId) },
                        { name: "AWS_ACCESS_KEY_ID", valueFrom: { secretKeyRef: { name: "aws", key: "AWS_ACCESS_KEY_ID" } } },
                        { name: "AWS_SECRET_ACCESS_KEY", valueFrom: { secretKeyRef: { name: "aws", key: "AWS_SECRET_ACCESS_KEY" } } },
                        { name: "AWS_REGION", valueFrom: { secretKeyRef: { name: "aws", key: "AWS_REGION" } } }
                    ],
                    volumeMounts: [
                        { name: "workspace-volume", mountPath: "/workspace" }
                    ]
                }
            ],
            containers: [
                {
                    image: "template",
                    imagePullPolicy: "IfNotPresent",
                    name: 'sandbox-container',
                    ports: [{ containerPort: 5173, name: "http" }],
                    resources: {
                        limits: { cpu: "500m", memory: "1Gi" },
                        requests: { cpu: "250m", memory: "500Mi" }
                    },
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/workspace"
                        }
                    ]
                },
                {
                    image: "agent",
                    imagePullPolicy: "IfNotPresent",
                    name: 'agent-container',
                    ports: [{ containerPort: 3000, name: "http" }],
                    resources: {
                        limits: { cpu: "500m", memory: "1Gi" },
                        requests: { cpu: "250m", memory: "500Mi" }
                    },
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            mountPath: "/workspace"
                        }
                    ]
                },
                {
                    image: "sync-agent",
                    imagePullPolicy: "IfNotPresent",
                    name: 'sync-agent-container',
                    ports: [{ containerPort: 4000, name: "http" }],
                    resources: {
                        limits: { cpu: "500m", memory: "1Gi" },
                        requests: { cpu: "250m", memory: "500Mi" }
                    },
                    volumeMounts: [
                        {
                            name: 'workspace-volume',
                            mountPath: '/workspace'
                        }
                    ],
                    env: [
                        {
                            name: "PROJECT_ID",
                            value: String(projectId)
                        },
                        {
                            name: "AWS_ACCESS_KEY_ID",
                            valueFrom: {
                                secretKeyRef: {
                                    name: "aws",
                                    key: "AWS_ACCESS_KEY_ID"
                                }
                            }
                        },
                        {
                            name: "AWS_SECRET_ACCESS_KEY",
                            valueFrom: {
                                secretKeyRef: {
                                    name: "aws",
                                    key: "AWS_SECRET_ACCESS_KEY"
                                }
                            }

                        },
                        {
                            name: "AWS_REGION",
                            valueFrom: {
                                secretKeyRef: {
                                    name: "aws",
                                    key: "AWS_REGION"
                                }
                            }
                        }
                    ]
                }
            ]
        }
    }

    const response = await k8sCoreV1Api.createNamespacedPod({
        namespace: 'default',
        body: podManifest
    })

    return response;
}

export async function getActivePod(sandboxId) {
    if (!sandboxId) return null;
    try {
        const pod = await k8sCoreV1Api.readNamespacedPod({
            name: `sandbox-pod-${sandboxId}`,
            namespace: 'default'
        });
        const phase = pod.status?.phase;
        const isTerminating = Boolean(pod.metadata?.deletionTimestamp);
        if ((phase === 'Running' || phase === 'Pending') && !isTerminating) {
            return pod;
        }
    } catch {
        // Pod not found or error
    }
    return null;
}

export async function findActivePodByProjectId(projectId) {
    if (!projectId) return null;
    try {
        const response = await k8sCoreV1Api.listNamespacedPod({
            namespace: 'default',
            labelSelector: 'app=sandbox'
        });
        const items = response.items || [];
        for (const pod of items) {
            if (!pod.metadata?.name?.startsWith('sandbox-pod-')) continue;
            if (pod.status?.phase === 'Failed' || pod.metadata?.deletionTimestamp) continue;

            // Check label
            if (pod.metadata?.labels?.projectId === String(projectId)) {
                return pod;
            }

            // Check container env vars (PROJECT_ID)
            const syncContainer = pod.spec?.containers?.find(c => c.name === 'sync-agent-container');
            const projectEnv = syncContainer?.env?.find(e => e.name === 'PROJECT_ID');
            if (projectEnv?.value === String(projectId)) {
                return pod;
            }
        }
    } catch (err) {
        console.error('Error finding active pod by projectId:', err.message);
    }
    return null;
}

export async function deletePod(sandboxId) {
    const response = await k8sCoreV1Api.deleteNamespacedPod({
        namespace: 'default',
        name: `sandbox-pod-${sandboxId}`
    }, {
        gracePeriodSeconds: 0,
    })

    return response;
}