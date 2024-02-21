<script setup>
import {computed, onMounted, ref} from "vue";
import { createClient } from '@supabase/supabase-js'
import OrderModal from "@/components/ModalViews/OrderModal.vue";

const schema = ref([]);
const client = ref(null);

// const movieSessionId = router.currentRoute._value.query.movie_session_id ?? null;
const route = useRoute();
const movieSessionId = route.query.movie_session_id;
const selectedLimit = 6;

const orderModalShow = ref(false);


const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const apiUrl = "https://tickets.web2cat.ru/supabase";


const colCount = ref(1);
const selectedPlace = ref([]);

const occupiedPlaces = ref([]);
const occupiedPlacesDictionary = ref([]);
const getOccupiedPlaces = async () => {
  const response = await client.value
      .from("MovieBookingSeat")
      .select("*")
      .eq("session_id", movieSessionId);
  occupiedPlaces.value = response.data;
  occupiedPlaces.value.forEach(place => {
    occupiedPlacesDictionary.value.push(`${place.row}_${place.place}`);
  });
};

onMounted(async () => {
  client.value = createClient(apiUrl, key,  { db: { schema: 'public' } });
  const {data, error} = await client.value.from("MovieHallScheme").select("*");
  schema.value = data[0].json_schema;
  colCount.value = schema.value[0].length;
  await getOccupiedPlaces();
  subscribeToUpdateBookingSeat();
});

const subscribeToUpdateBookingSeat = () => {
  client.value.channel(`insert_session_${movieSessionId}`)
      .on('postgres_changes', { event: "insert", schema: 'public', table: 'MovieBookingSeat', filter: `session_id=eq.${movieSessionId}` }, (payload) => {
        getOccupiedPlaces();
      }).subscribe();
};

const isSelected = (place) => {
  let res = false;
  selectedPlace.value.forEach((sel_place, idx) => {
    if(sel_place.place !== place.place) { return; }
    if(sel_place.row !== place.row) { return; }
    res = idx;
  });
  return res;
};

const selectPlace = (event, row, place) => {


  const selected_idx = isSelected({...place, row});
  if(selected_idx !== false) {
    selectedPlace.value.splice(selected_idx, 1);
  } else {

    if(selectedPlace.value.length > selectedLimit - 1) {
      onSelectedLimitHandler();
      return;
    }

    selectedPlace.value.push({...place, row});
  }
};

const onSelectedLimitHandler = () => {
  alert("Превышен лимит!")
};

const totalPrice = computed(() => {
  let total = 0;
  selectedPlace.value.forEach((place) => {
    total += place.price;
  });
  return total;
});

const bookPlaces = async () => {

  orderModalShow.value = true;

  selectedPlace.value.map((place) => {
    place['session_id'] = movieSessionId;
    return place;
  });

  const response = await client.value.from("MovieBookingSeat").insert(selectedPlace.value).select();
};

const orderPayload = () => {
  return {
    places: selectedPlace.value,
    price: totalPrice.value,
    session_id: movieSessionId
  };
};


</script>

<template>
  <h1>Booking</h1>
  <div class="place-grid" :style="`grid-template-columns: repeat(${colCount + 1}, 1fr)`">
    <template v-for="(row, rowIdx) in schema">
      <div class="place">Ряд {{ rowIdx + 1 }}</div>
      <template v-for="place in row">
        <div v-if="place === null" class="place empty"></div>
        <template v-else>
          <div v-if="occupiedPlacesDictionary.includes(`${rowIdx + 1}_${ place.place }`)" class="place occupied"></div>
          <div v-else @click="selectPlace($event, rowIdx + 1, place)"  class="place free">
            <span :class="{ selected: isSelected({ ...place, row: rowIdx + 1 }) !== false }">
              <span>{{ place.place }}</span>
            </span>
          </div>
        </template>

      </template>
    </template>
  </div>
  <div class="selected-places" :class="{
    hidden: selectedPlace.length === 0
  }">
    <div class="list">
      <p v-for="place in selectedPlace">Ряд {{place.row}}, место {{ place.place }}</p>
    </div>
    <div @click="bookPlaces" :class="{disable: totalPrice === 0}" class="booking-btn">Купить за {{totalPrice}}</div>
  </div>
  <Modal title="Оплата" :component="OrderModal" v-model:is-show="orderModalShow" :payload="orderPayload()" />
</template>

<style scoped>

  .booking-btn {
    padding: 1.5rem 4rem;
    background: #0984e3;
    border-radius: 3rem;
    cursor: pointer;
  }

  .booking-btn.disable {
    background: #636e7277;
  }

  .selected-places .list {
    display: flex;
    gap: 1rem;
  }

  .place-grid {
    display: grid;
    width: 100%;
    margin: auto;
    gap: 0.5rem;
  }

  .place {
    width: 30px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    white-space: nowrap;
  }

  .place > span {
    display: block;
    width: 30px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .place.free {
    //border-radius: 0.5rem;
    //background: #74b9ff;
    //cursor: pointer;
  }

  .place.free > span {
    opacity: 1;
    transition: opacity 0.3s;
    border-radius: 0.5rem;
    background: #74b9ff;
    cursor: pointer;
  }

  .place.free > span > span {
    opacity: 0;
    transition: opacity 0.3s;
  }

  .place.free:hover > span > span {
    opacity: 1;
  }

  .place > span.selected {
    border: 2px solid black;
  }

  .place.occupied {
    position: relative;
  }

  .place.occupied::after {
    position: absolute;
    content: "";
    width: 20px;
    height: 20px;
    border-radius: 100%;
    background: #636e72;
  }


  .selected-places {
    position: fixed;
    bottom: 0;
    border: 1px solid black;
    border-radius: 2rem 2rem 0 0 ;
    padding: 2rem;
    width: 80%;
    margin: auto 0;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: 0.5s;
  }

  .selected-places.hidden {
    bottom: -100%;
  }

  @media screen and (max-width: 768px) {
    .place-grid {
      gap: 0.2rem;
      width: 100%;
    }

    .place {
      //width: 15px;
      //height: 15px;
      padding: 5px 0;
    }
  }

</style>