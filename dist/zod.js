import { z } from 'zod';
// Schema definition matching index.ts structure
const schema = z.object({
    id: z.string(),
    email: z.string().email('Zadej platný mail'),
    tags: z.array(z.object({
        tagGroupId: z.string(),
        groupName: z.string(),
        priority: z.number(),
        items: z.array(z.object({
            tagId: z.string(),
            tagName: z.string(),
            type: z.string(),
            metadata: z.object({
                level: z.number(),
                labels: z.array(z.string()),
                config: z.object({
                    active: z.boolean(),
                    value: z.string(),
                    options: z.array(z.object({
                        key: z.string(),
                        val: z.string(),
                    })),
                }),
            }),
        })),
    })),
});
const neznamaData = {
    id: 'a',
    email: 'test@test.com',
    tags: [
        {
            tagGroupId: 'group-1',
            groupName: 'Primary Tags',
            priority: 1,
            items: [
                {
                    tagId: 'tag-001',
                    tagName: 'important',
                    type: 'system',
                    metadata: {
                        level: 5,
                        labels: ['urgent', 'critical'],
                        config: {
                            active: true,
                            value: 'HIGH',
                            options: [
                                { key: 'severity', val: 'critical' },
                                { key: 'notify', val: 'true' },
                            ],
                        },
                    },
                },
                {
                    tagId: 'tag-002',
                    tagName: 'processing',
                    type: 'status',
                    metadata: {
                        level: 3,
                        labels: ['in-progress', 'active'],
                        config: {
                            active: true,
                            value: 'MEDIUM',
                            options: [
                                { key: 'timeout', val: '3600' },
                                { key: 'retry', val: 'true' },
                            ],
                        },
                    },
                },
            ],
        },
        {
            tagGroupId: 'group-2',
            groupName: 'Secondary Tags',
            priority: 2,
            items: [
                {
                    tagId: 'tag-003',
                    tagName: 'archived',
                    type: 'lifecycle',
                    metadata: {
                        level: 1,
                        labels: ['old', 'deprecated'],
                        config: {
                            active: false,
                            value: 'LOW',
                            options: [{ key: 'hidden', val: 'true' }],
                        },
                    },
                },
            ],
        },
    ],
};
// ✅ 1. Parse and validate data
const data = schema.parse(neznamaData);
// data.id (string)
// data.email (string)
// data.tags (array)
console.dir(data, { depth: null });
//# sourceMappingURL=zod.js.map