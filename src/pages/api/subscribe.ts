import type { APIRoute } from 'astro';

export const prerender = false;

const listmonkSubscriptionUrl = 'https://listmonk.yorukot.me/api/public/subscription';
const blogListUuid = 'f16f961b-3d32-47ae-87a6-29766cde5381';

const json = (body: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(body), {
        ...init,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...init?.headers,
        },
    });

const isEmail = (value: unknown): value is string =>
    typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const POST: APIRoute = async ({ request }) => {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch {
        return json({ message: 'Invalid subscription request.' }, { status: 400 });
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return json({ message: 'Invalid subscription request.' }, { status: 400 });
    }

    const email = Reflect.get(payload, 'email');
    const name = Reflect.get(payload, 'name');

    if (!isEmail(email)) {
        return json({ message: 'Enter a valid email address.' }, { status: 400 });
    }

    const response = await fetch(listmonkSubscriptionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            name: typeof name === 'string' ? name : '',
            list_uuids: [blogListUuid],
        }),
    });

    if (!response.ok) {
        let message = 'Subscription failed. Please try again.';

        try {
            const result = await response.json();

            if (
                result &&
                typeof result === 'object' &&
                'message' in result &&
                typeof result.message === 'string' &&
                result.message.trim()
            ) {
                message = result.message;
            }
        } catch {
            // Keep the generic retry message when listmonk does not return JSON.
        }

        return json({ message }, { status: response.status });
    }

    return json({ status: 'success' });
};
