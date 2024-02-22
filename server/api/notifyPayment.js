import * as fs from "fs";
import {createClient} from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
    let body = await readBody(event);
    const url = process.env.SB_URL;
    const key = process.env.SB_KEY;
    const supabase = createClient(url, key);
    switch (body.Status) {
        case "CONFIRMED":
            await supabase.from("Payments")
                .update({ is_paid: true, pan: body.Pan, cardExpDate: body.ExpDate, status: "CONFIRMED" })
                .eq("id", body.OrderId);
            break;
        case "REJECTED":
            await supabase.from("MovieBookingSeat").delete().eq("payment_id", body.OrderId);
            await supabase.from("Payments")
                .update({ pan: body.Pan, cardExpDate: body.ExpDate, status: "REJECT" })
                .eq('id', body.OrderId);
    }
});