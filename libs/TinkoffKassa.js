export const useTinkoffKassa = () => {

    const CONST = () => {
        const tinkoff_url = process.env.TK_URL;
        const TerminalKey = process.env.TK_TerminalKey;
        const password = process.env.TK_Password;
        return {
            tinkoff_url,
            TerminalKey,
            password
        };
    };

    const sha256 = async (str) => {
        const buffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    };

    const genToken = async (body) => {
        const sortedKeys = Object.keys(body).sort();
        let strBodyValues = "";
        sortedKeys.forEach(key => {
            strBodyValues += body[key];
        });
        return await sha256(strBodyValues);
    };

    const request = async (endpoint, data) => {
        data.Password = CONST().password;
        data.TerminalKey = CONST().TerminalKey;
        const tokenizedBody = {};
        Object.keys(data).forEach(key => {
            if(typeof data[key] === 'object') { return false; }
            tokenizedBody[key] = data[key];
        });
        data.Token = await genToken(tokenizedBody);

        return fetch(`${CONST().tinkoff_url}${endpoint}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(data)
        });
    };

    return {
        request
    };
};