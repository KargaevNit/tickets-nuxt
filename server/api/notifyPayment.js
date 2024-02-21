import * as fs from "fs";
import {createClient} from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
    let body = await readBody(event);
    body = JSON.parse(body);
    const supabase = createClient("https://ajaijburhzihuzlqldup.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYWlqYnVyaHppaHV6bHFsZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg1MTA5OTgsImV4cCI6MjAyNDA4Njk5OH0.H1hQLcR46arQEMmL0a-C2rvW_JU7DMJ4AWEZ-6BANd8");
    console.log(body);
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