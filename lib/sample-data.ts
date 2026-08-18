import type { Memory } from "./types";
import { pandaSharedJournal } from "./journals";

const RAW_SAMPLE_MEMORIES: Omit<Memory, "visibility" | "owner">[] = [
  {
    id: "5ac968e8-1276-450d-a6c3-6d317eaa6920",
    title: "Where we met",
    date: "2026-03-18",
    lat: -36.8566664,
    lng: 174.7466327,
    placeName: "Goblin",
    address: "134 Ponsonby Road, Grey Lynn, Auckland 1011, New Zealand",
    type: "met",
    journals: pandaSharedJournal(
      "Wednesday night upstairs on Ponsonby Road. The first time we were in the same room, before we actually talked."
    ),
    photoIds: [],
    createdAt: "2026-03-18T10:00:00.000Z",
    updatedAt: "2026-03-18T10:00:00.000Z",
  },
  {
    id: "746f9582-eb45-4ad5-abfc-e38260492c95",
    title: "First conversation",
    date: "2026-04-19",
    lat: -36.8715001,
    lng: 174.7476857,
    placeName: "Saint Leonards",
    address: "394 New North Road, Kingsland, Auckland 1021, New Zealand",
    type: "date",
    journals: pandaSharedJournal(
      "You weren't supposed to be there, Victor was late. A girl asked for your Instagram, so you did the same with her. First time we actually talked. Then a random dinner invite you actually accepted."
    ),
    photoIds: [],
    createdAt: "2026-04-19T10:00:00.000Z",
    updatedAt: "2026-04-19T10:00:00.000Z",
  },
  {
    id: "a87c1a69-c5c4-4b0e-a2fb-b6c910d9ad0e",
    title: "First dinner at hers",
    date: "2026-04-24",
    lat: -36.8741573,
    lng: 174.7518837,
    placeName: "172 Dominion Road",
    address: "172 Dominion Road, Mount Eden, Auckland 1024, New Zealand",
    type: "date",
    journals: pandaSharedJournal(
      "The invite after Saint Leonards, and you came. First dinner in the princess-room castle on Dominion Road."
    ),
    photoIds: [],
    createdAt: "2026-04-24T10:00:00.000Z",
    updatedAt: "2026-04-24T10:00:00.000Z",
  },
  {
    id: "35559262-3137-4d0a-9355-9eef1e31fee2",
    title: "Dinner at Blue",
    date: "2026-04-25",
    lat: -36.8535009,
    lng: 174.745908,
    placeName: "Blue",
    address: "1 Franklin Road, Ponsonby, Auckland 1011, New Zealand",
    type: "date",
    journals: pandaSharedJournal(
      "The night after first dinner at hers. Café by day, wine bar by night, Franklin Road, Ponsonby."
    ),
    photoIds: [],
    createdAt: "2026-04-25T10:00:00.000Z",
    updatedAt: "2026-04-25T10:00:00.000Z",
  },
  {
    id: "d7588140-3243-4471-8127-53f5785b0129",
    title: "SIR party",
    date: "2026-05-01",
    lat: -36.8574935,
    lng: 174.7601674,
    placeName: "SIR at Double Whammy",
    address: "183 Karangahape Road, Auckland 1010, New Zealand",
    type: "celebration",
    journals: pandaSharedJournal(
      "SIR Relay at Double Whammy, shameless, intimate, respected. First proper night out as part of her world on K Road."
    ),
    photoIds: [],
    createdAt: "2026-05-01T10:00:00.000Z",
    updatedAt: "2026-05-01T10:00:00.000Z",
  },
  {
    id: "339fbb83-2b27-4881-9476-43091be1d9f6",
    title: "Island moments",
    date: "2026-05-16",
    lat: -36.7818656,
    lng: 175.0077401,
    placeName: "Waiheke",
    address: "Oneroa, Waiheke Island, Auckland, New Zealand",
    type: "trip",
    journals: pandaSharedJournal(
      "Walking the track, bubbling and laughing on video. Writing in the imaginary gratitude journal. A blessed day, the island moments neither of us would have wanted to miss."
    ),
    photoIds: [],
    createdAt: "2026-05-16T10:00:00.000Z",
    updatedAt: "2026-05-16T10:00:00.000Z",
  },
  {
    id: "0ce87e26-9c4b-41a4-bdf2-ce4dfb70564b",
    title: "Hello Stranger",
    date: "2026-05-17",
    lat: -36.8741573,
    lng: 174.7518837,
    placeName: "Auckland",
    address: "Auckland, New Zealand",
    type: "custom",
    journals: pandaSharedJournal(
      "First WhatsApp. Hello Stranger. All the small coincidences that led here, Saint Leonards, the dinner invite, the weeks of tiny benders, and the fact that none of it quite makes sense, which is what makes it beautiful."
    ),
    photoIds: [],
    createdAt: "2026-05-17T10:00:00.000Z",
    updatedAt: "2026-05-17T10:00:00.000Z",
  },
  {
    id: "1f941338-4dbe-47dc-9229-fa93568cdfa1",
    title: "Meeting Rishabh",
    date: "2026-05-21",
    lat: -36.8497417,
    lng: 174.7784593,
    placeName: "20 Augustus Terrace",
    address: "20 Augustus Terrace, Parnell, Auckland 1053, New Zealand",
    type: "custom",
    journals: pandaSharedJournal(
      "After CLEAR you went to her office, met Rishabh, then slept in the princess room. It was a pleasure to have you in her castle, and to meet someone so important in her world."
    ),
    photoIds: [],
    createdAt: "2026-05-21T10:00:00.000Z",
    updatedAt: "2026-05-21T10:00:00.000Z",
  },
  {
    id: "fb4ed8c4-efe5-4855-a8c7-6eea5e2bd570",
    title: "Official",
    date: "2026-06-04",
    lat: -36.8578257,
    lng: 174.7398183,
    placeName: "Auckland",
    address: "21 Chamberlain Street, Grey Lynn, Auckland 1021, New Zealand",
    type: "celebration",
    journals: pandaSharedJournal(
      "The Thursday you became her official French boyfriend. Also the day you first wrote: because I love you very much."
    ),
    photoIds: [],
    createdAt: "2026-06-04T10:00:00.000Z",
    updatedAt: "2026-06-04T10:00:00.000Z",
  },
  {
    id: "6391fa18-1310-46ff-a3bd-c50112c45f15",
    title: "The French castle",
    date: "2026-06-09",
    lat: -36.8578257,
    lng: 174.7398183,
    placeName: "21 Chamberlain Street",
    address: "21 Chamberlain Street, Grey Lynn, Auckland 1021, New Zealand",
    type: "home",
    journals: pandaSharedJournal(
      "How do I get in the French castle? Morning on bikes, completely the opposite, and love doing life with you."
    ),
    photoIds: [],
    createdAt: "2026-06-09T10:00:00.000Z",
    updatedAt: "2026-06-09T10:00:00.000Z",
  },
  {
    id: "607e7df2-4034-4ab8-888d-59b0a1c96b65",
    title: "Hello Beasty",
    date: "2026-06-13",
    lat: -36.8432292,
    lng: 174.7624765,
    placeName: "Hello Beasty",
    address: "95-97 Customs Street West, Viaduct Harbour, Auckland 1010, New Zealand",
    type: "date",
    journals: pandaSharedJournal(
      "Booked 8:15pm, then on to Sorry Mum with loved ones. A month-of-us dinner and a boogie, every Sorry Mum a reminder."
    ),
    photoIds: [],
    createdAt: "2026-06-13T10:00:00.000Z",
    updatedAt: "2026-06-13T10:00:00.000Z",
  },
  {
    id: "7f7da246-5ab3-42bc-9be4-20ca577e9626",
    title: "Käsiges getaway",
    date: "2026-06-20",
    lat: -36.8957959,
    lng: 174.4445785,
    placeName: "Bethells Beach",
    address: "Te Henga / Bethells Beach, Waitākere Ranges, Auckland, New Zealand",
    type: "trip",
    journals: pandaSharedJournal(
      "Weekend away west. Picnic, recharge, no FOMO about silent studios. It was very special, we will always connect Bethells with that time."
    ),
    photoIds: [],
    createdAt: "2026-06-20T10:00:00.000Z",
    updatedAt: "2026-06-20T10:00:00.000Z",
  },
  {
    id: "a3507ac8-bc45-4258-a4ed-7b1b91bbe182",
    title: "Cooking for Antonia and Rishabh",
    date: "2026-07-11",
    lat: -36.8578257,
    lng: 174.7398183,
    placeName: "21 Chamberlain Street",
    address: "21 Chamberlain Street, Grey Lynn, Auckland 1021, New Zealand",
    type: "date",
    journals: pandaSharedJournal(
      "The chef cooked for her people, Antonia and Rishabh, in the French castle kitchen. Feeding the ones she loves."
    ),
    photoIds: [],
    createdAt: "2026-07-11T10:00:00.000Z",
    updatedAt: "2026-07-11T10:00:00.000Z",
  },
  {
    id: "5e827aa0-b719-4bc3-898e-cfe6ca9cd7cd",
    title: "Reunion in Marseille",
    date: "2026-08-24",
    lat: 43.2945804,
    lng: 5.3692811,
    placeName: "Vieux-Port, Marseille",
    address: "Vieux-Port, Marseille, France",
    type: "trip",
    journals: pandaSharedJournal(
      "The first European morning next to each other. Marseille, the Vieux-Port, and picnics in the Calanques still ahead. We worked late nights for this."
    ),
    photoIds: [],
    createdAt: "2026-08-24T10:00:00.000Z",
    updatedAt: "2026-08-24T10:00:00.000Z",
  },
  {
    id: "037d7b95-fc8c-410f-9124-49d097d6008b",
    title: "Avignon, meeting Aunty",
    date: "2026-08-28",
    lat: 43.9492493,
    lng: 4.8059012,
    placeName: "Avignon",
    address: "Avignon, Vaucluse, France",
    type: "trip",
    journals: pandaSharedJournal(
      "Back to his hometown for the last days in France. She meets his aunty, two days in Avignon after the sea."
    ),
    photoIds: [],
    createdAt: "2026-08-28T10:00:00.000Z",
    updatedAt: "2026-08-28T10:00:00.000Z",
  },
  {
    id: "eece771d-2393-493d-a841-591e2944a199",
    title: "Meeting in Germany",
    date: "2026-09-08",
    lat: 53.3725785,
    lng: 7.4392346,
    placeName: "Ostfriesland",
    address: "Eastern Friesland, Lower Saxony, Germany",
    type: "trip",
    journals: pandaSharedJournal(
      "He comes to her. Ostfriesland, mum, the e-bike, lüften, and the place that made her. Stoked to show him her upbringing."
    ),
    photoIds: [],
    createdAt: "2026-09-08T10:00:00.000Z",
    updatedAt: "2026-09-08T10:00:00.000Z",
  },
  {
    id: "ca5357c4-b684-498a-8cde-39d223f87576",
    title: "Henne's birthday",
    date: "2026-09-09",
    lat: 53.3725785,
    lng: 7.4392346,
    placeName: "Ostfriesland",
    address: "Eastern Friesland, Lower Saxony, Germany",
    type: "celebration",
    journals: pandaSharedJournal(
      "Her birthday, at home in Germany, with him there. The present he was working on from the other side of the world finally gets to be given in person."
    ),
    photoIds: [],
    createdAt: "2026-09-09T10:00:00.000Z",
    updatedAt: "2026-09-09T10:00:00.000Z",
  },
];

export const SAMPLE_MEMORIES: Memory[] = RAW_SAMPLE_MEMORIES.map((memory) => ({
  ...memory,
  visibility: "shared",
  owner: null,
}));

export const AUCKLAND_CENTER = { lat: -36.8485, lng: 174.7633, zoom: 11 };
export const WORLD_VIEW = { lat: -20, lng: 160, zoom: 2 };
