import * as fs from "fs";

export default defineEventHandler(async (event) => {
    const body = JSON.parse(await readBody(event));
    const query = getQuery(event);
    fs.writeFile(__dirname + "/logs/notify.log", JSON.stringify({
        body,
        query
    }), (err) => {});
    console.log(body, query);
});