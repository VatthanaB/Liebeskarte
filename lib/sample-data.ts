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
      "Wednesday night, upstairs at Goblin on Ponsonby Road. I didn't know it yet — but that was the first time we were in the same room. Before a single real conversation."
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
      "You weren't even supposed to be there — Victor was late. A girl asked for my Instagram, so you playfully did the same with her. Our first real conversation. Then you invited me to dinner — and I actually said yes."
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
      "You invited me after Saint Leonards — and I came. Our first dinner together, in your princess-room castle on Dominion Road. I still can't believe I said yes."
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
      "The night after dinner at yours. Blue on Franklin Road — café by day, wine bar by night. I just wanted to see you again."
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
      "SIR Relay at Double Whammy — shameless, intimate, respected. My first proper night out in your world on K Road. I loved every second of it."
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
      "We walked the track, bubbling and laughing on video. Our imaginary gratitude journal. Such a blessed day — I wouldn't have missed a single island moment with you."
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
      "Our first WhatsApp. Hello Stranger. Saint Leonards, when you invited me to dinner, those weeks of tiny benders — none of it quite makes sense. That's exactly what makes it beautiful."
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
      "After CLEAR I came to your office, met Rishabh, then stayed in the princess room. I loved having you show me your world — and meeting someone so important in it."
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
    address: "Richmond Road, Grey Lynn, Auckland 1021, New Zealand",
    type: "celebration",
    journals: pandaSharedJournal(
      "The Thursday I became your official French boyfriend. And the first time I wrote it plainly: because I love you very much."
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
    placeName: "Richmond Road",
    address: "Richmond Road, Grey Lynn, Auckland 1021, New Zealand",
    type: "home",
    journals: pandaSharedJournal(
      "How do I get into the French castle? Mornings on bikes — we're completely the opposite, and I love doing life with you."
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
      "I booked us for 8:15pm, then on to Sorry Mum with the people we love. Our one-month dinner and a boogie — every Sorry Mum still reminds me of you."
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
      "A weekend away west — picnic, recharge, zero FOMO about silent studios. So special. I'll always connect Bethells with you."
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
    placeName: "Richmond Road",
    address: "Richmond Road, Grey Lynn, Auckland 1021, New Zealand",
    type: "date",
    journals: pandaSharedJournal(
      "I cooked for your people — Antonia and Rishabh — in our French castle kitchen. Feeding the ones you love felt like the sweetest thing."
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
      "Our first European morning waking up next to you. Marseille, the Vieux-Port, Calanques picnics still ahead. We worked so many late nights for this — and you were worth every one."
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
      "I took you back to my hometown for our last days in France. You met my aunty — two soft days in Avignon after the sea."
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
      "I flew to you. Ostfriesland, your mum, the e-bike, lüften — the place that made you. I was so stoked you wanted to show me where you grew up."
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
      "Your birthday, at home in Germany, with me finally there. The present I'd been building from the other side of the world — I got to give it to you in person."
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

/** Short Auckland cluster for the empty-map demo seed (development only). */
export const DEMO_MEMORIES = SAMPLE_MEMORIES.slice(0, 4);

export const AUCKLAND_CENTER = { lat: -36.8485, lng: 174.7633, zoom: 11 };
export const WORLD_VIEW = { lat: -20, lng: 160, zoom: 2 };
