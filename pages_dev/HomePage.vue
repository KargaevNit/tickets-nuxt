<script setup>
import {computed, onMounted, ref} from "vue";
import { createClient } from '@supabase/supabase-js'
import OrderModal from "@/components/ModalViews/OrderModal.vue";
import ScreenImage from "~/components/ScreenImage.vue";

const schema = ref([]);
const client = ref(null);

// const movieSessionId = router.currentRoute._value.query.movie_session_id ?? null;
const route = useRoute();
const movieSessionId = route.query.movie_session_id;
const selectedLimit = 6;

const orderModalShow = ref(false);

const config = useRuntimeConfig();

const key = config.public.SB_KEY;
const apiUrl = config.public.SB_URL;

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
  schema.value = data[0].json_scheme;
  colCount.value = schema.value[0].length;
  await getOccupiedPlaces();
  subscribeToUpdateBookingSeat();
});

const subscribeToUpdateBookingSeat = () => {
  client.value.channel(`insert_session_${movieSessionId}`)
      .on('postgres_changes', { event: "insert", schema: 'public', table: 'MovieBookingSeat', filter: `session_id=eq.${movieSessionId}` }, (payload) => {
        getOccupiedPlaces();
      })
      .on('postgres_changes', { event: "delete", schema: 'public', table: 'MovieBookingSeat', filter: `session_id=eq.${movieSessionId}` }, (payload) => {
        getOccupiedPlaces();
      })
      .subscribe();
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

const priceColor = {
  5000: "#4cd137",
  3000: "#74b9ff",
  2000: "#9c88ff"
};

const getColorByPrice = (price) => {
  const color = priceColor[price];
  if(typeof color === undefined) { return "#74b9ff"; }
  return color;
};

</script>

<template>
  <div style="width: 100vw; display: flex; flex-direction: column; height: 100vh; overflow: auto">
    <div style="margin: 0 auto; width: 100vw;">
      <ScreenImage class="screen" />
      <div class="legend">
        <div v-for="(color, price) in priceColor" class="legend-dot">
          <div class="dot" :style="`background-color: ${color};`"></div>
          <div class="price">{{ price }}руб</div>
        </div>
      </div>
    </div>
    <div class="place-grid" style="flex: 1; overflow: auto" :style="`grid-template-columns: repeat(${colCount + 1}, 1fr)`">
      <template v-for="(row, rowIdx) in schema">
        <div class="place">Ряд {{ rowIdx + 1 }}</div>
        <template v-for="place in row">
          <div v-if="place === null" class="place empty"></div>
          <template v-else>
            <div v-if="occupiedPlacesDictionary.includes(`${rowIdx + 1}_${ place.place }`)" class="place occupied"></div>
            <div v-else @click="selectPlace($event, rowIdx + 1, place)"  class="place free">
            <span :style="{ background: getColorByPrice(place.price) }" :class="{ selected: isSelected({ ...place, row: rowIdx + 1 }) !== false }">
              <span>{{ place.place }}</span>
            </span>
            </div>
          </template>
        </template>
      </template>
    </div>
    <div>
      <div class="selected-places" :class="{
      hidden: selectedPlace.length === 0
    }">
        <div class="list">
          <p v-for="place in selectedPlace">Ряд {{place.row}}, место {{ place.place }}</p>
        </div>
        <div @click="bookPlaces" :style="{ transform: `translateX(${leftScroll}px)` }" :class="{disable: totalPrice === 0}" class="booking-btn">Купить за {{ totalPrice }}</div>
      </div>
    </div>

    <Modal title="Оплата" :component="OrderModal" v-model:is-show="orderModalShow" :payload="orderPayload()" />
  </div>
</template>

<style scoped>

  .legend {
    display: flex;
    justify-content: space-around;
    width: 100%;
    padding: 1rem 0;
  }

  .legend-dot {
    display: flex;
    justify-content: space-around;
    align-items: center;
    gap: 0.5rem;
  }

  .legend-dot > .dot {
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }

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
    width: max-content;
    margin: 0 auto;
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
    box-sizing: border-box;
    position: sticky;
    left: 0px;
    box-shadow: 0 0 5px 0 #000000;
    padding: 2rem;
    width: 100vw;
    margin: 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: 0.5s;
  }

  .selected-places.hidden {
    transform: translateX(-200%);
  }

  @media screen and (max-width: 768px) {
    .place-grid {
      gap: 0.2rem;
      width: 100%;
    }

    .place {
      padding: 5px 0;
    }

    .selected-places .list {
      flex-direction: column;
      gap: 0;
    }

    .selected-places .list > p {
      margin: 0;
    }

    .screen {
      display: none;
    }
  }


</style>