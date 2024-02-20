export default defineEventHandler(async (event) => {
    const body = JSON.parse(await readBody(event));
    const query = getQuery(event);
    console.log(body, query);
});