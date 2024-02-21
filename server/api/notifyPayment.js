import * as fs from "fs";

export default defineEventHandler(async (event) => {
    let body = await readBody(event);
    const query = getQuery(event);
    fs.writeFile("notify.log", JSON.stringify({
        body,
        query
    }), (err) => {});
    console.log(body, query);
});