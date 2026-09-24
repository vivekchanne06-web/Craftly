import Redis from 'ioredis';
import { deletePod } from '../kubernetes/pod.js';
import { deleteService } from '../kubernetes/service.js';


const redis = new Redis(process.env.REDIS_URL);
const subscriber = new Redis(process.env.REDIS_URL);

redis.on('error', (err) => {
    console.error('Redis error:', err.message);
});

subscriber.on('error', (err) => {
    console.error('Redis subscriber error:', err.message);
});

export async function createSandboxKey(sandboxId) {
    try {
        await redis.set(`sandbox:${sandboxId}`, JSON.stringify({
            status: 'active'
        }), "EX", 60*60);
    } catch (err) {
        console.error('Error creating sandbox key in Redis:', err.message);
    }
}

subscriber.config('SET', 'notify-keyspace-events', 'Ex').catch((err) => {
    console.error('Redis config SET notify-keyspace-events error:', err.message);
});

subscriber.subscribe('__keyevent@0__:expired').catch((err) => {
    console.error('Redis subscribe error:', err.message);
});

subscriber.on('message', async (channel, key) => {
    console.log(`Key expired: ${key}`);

    /**
     *  sandbox:019e4104-020b-764e-b366-74ee0429d36a
     */
    const sandboxId = key.split(':')[ 1 ];

    if (sandboxId) {
        // Delete the associated Kubernetes resources
        await deletePod(sandboxId).catch(() => {});
        await deleteService(sandboxId).catch(() => {});
    }
});

export default { subscriber };