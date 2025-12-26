import { Cocobase } from "cocobase";

const apiKey = import.meta.env.VITE_COCOBASE_API_KEY;
if (!apiKey) {
    throw new Error('Missing VITE_COCOBASE_API_KEY environment variable');
}

export const cocobase = new Cocobase({
    apiKey,
});
