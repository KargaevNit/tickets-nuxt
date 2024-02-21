<script setup>

import {createClient} from "@supabase/supabase-js";
import {ref} from "vue";
import {useTinkoffKassa} from "~/libs/TinkoffKassa.js";

const props = defineProps({
  payload: {
    type: Object,
    default: {}
  }
});

const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYWlqYnVyaHppaHV6bHFsZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg1MTA5OTgsImV4cCI6MjAyNDA4Njk5OH0.H1hQLcR46arQEMmL0a-C2rvW_JU7DMJ4AWEZ-6BANd8";
const apiUrl = "https://ajaijburhzihuzlqldup.supabase.co";
const supabase = createClient(apiUrl, key);

const customerData = ref({
  full_name: "",
  email: "",
  phone: "",
  amount: props.payload.price,
  session_id: props.payload.session_id
});

const selectedPlacesInSupabase = ref([]);

const genReceiptBySelectedPlaces = () => {
  const Items = [];
  props.payload.places.forEach((place) => {
    Items.push({
      Name: `Билет на ${place.place} место в ${place.row} ряду`,
      Price: place.price * 100,
      Quantity: 1,
      Amount: place.price * 100,
      Tax: "vat10",
      Ean13: "303130323930303030630333435"
    });
  });
  return {
    Email: customerData.value.email,
    Phone: customerData.value.phone,
    Taxation: "osn",
    Items: Items
  };
};

const payment = async () => {
  const payment_res = await supabase.from("Payments")
      .insert([
        customerData.value
      ]).select();

  for(let i = 0; i < props.payload.places.length; i++) {
    const places_res = await supabase.from("MovieBookingSeat")
        .select()
        .eq("session_id", props.payload.places[i].session_id)
        .eq("row", props.payload.places[i].row)
        .eq("place", props.payload.places[i].place);

    const place = places_res.data[0];
    place.payment_id = payment_res.data[0].id;
    selectedPlacesInSupabase.value.push(place);
  }

  const selectedIds = [];
  selectedPlacesInSupabase.value.forEach(place => { selectedIds.push(place.id) });

  await supabase.from("MovieBookingSeat")
      .update(selectedPlacesInSupabase.value)
      .in("id", selectedIds)
      .select();

  const tk_init_payment_data = {
    Amount: customerData.value.amount * 100,
    OrderId: payment_res.data[0].id,
    Description: "Покупка билетов на мероприятие",
    DATA: {
      Phone: customerData.value.phone,
      Email: customerData.value.email
    },
    Receipt: genReceiptBySelectedPlaces(),
    NotificationURL: "https://tickets.web2cat.ru/api/notifyPayment"
  };

  const TinkoffKassa = useTinkoffKassa();
  const tk_payment_res = await fetch("/api/createPayment", {
    method: "post",
    body: JSON.stringify(tk_init_payment_data)
  }).then(res => res.json())
  window.location = tk_payment_res.PaymentURL;
};

</script>

<template>
  <form class="payform-tinkoff" @submit.prevent="payment" name="payform-tinkoff">
    <input v-model="customerData.full_name" class="payform-tinkoff-row" required type="text" placeholder="ФИО" name="name">
    <input v-model="customerData.email" class="payform-tinkoff-row" required type="email" placeholder="E-mail" name="email">
    <input v-model="customerData.phone" class="payform-tinkoff-row" required type="tel" placeholder="Контактный телефон" name="phone">
    <input class="payform-tinkoff-row payform-tinkoff-btn" type="submit" value="Оплатить">
  </form>
</template>

<style scoped>
.payform-tinkoff {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  margin: 2px auto;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
  max-width: 250px;
}
.payform-tinkoff-row {
  margin: 2px;
  border-radius: 4px;
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1;
  -webkit-transition: 0.3s;
  -o-transition: 0.3s;
  transition: 0.3s;
  border: 1px solid #DFE3F3;
  padding: 15px;
  outline: none;
  background-color: #DFE3F3;
  font-size: 15px;
}
.payform-tinkoff-row:focus {
  background-color: #FFFFFF;
  border: 1px solid #616871;
  border-radius: 4px;
}
.payform-tinkoff-btn {
  background-color: #FBC520;
  border: 1px solid #FBC520;
  color: #3C2C0B;
}
.payform-tinkoff-btn:hover {
  background-color: #FAB619;
  border: 1px solid #FAB619;
}
</style>