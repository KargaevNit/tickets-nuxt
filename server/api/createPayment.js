import {useTinkoffKassa} from "~/libs/TinkoffKassa.js";

export default defineEventHandler(async (event) => {
    console.log(process.env.TK_URL)
    const TinkoffKassa = useTinkoffKassa();
    const body = await readBody(event);
    return await TinkoffKassa.request("/Init", JSON.parse(body)).then(res => res.json());
});