export const stations = [
  {
    id: "fort",
    name: "Colombo Fort",
    city: "Colombo",
    desc: "Fort railway station is a major rail hub in Colombo. The station is served by many inter-city and commuter trains entering each day.",
    phone: "0112434215",
    hours: "Open - 24 Hours",
    email: "gmr@railway.gov.lk",
    head: "Mr. Jayasundara",
    image: "/station.jpg",
  },
  {
    id: "rath",
    name: "Rathmalana",
    city: "Colombo",
    desc: "Rathmalana is a busy suburban station serving commuter routes and intercity connections.",
    phone: "0112434215",
    hours: "Open - 24 Hours",
    email: "gmr@railway.gov.lk",
    head: "Mr. Jayasundara",
    image: "/station.jpg",
  },
  {
    id: "pana",
    name: "Panadura",
    city: "Kalutara",
    desc: "Panadura station connects important coastal route services and local commuters.",
    phone: "0112434215",
    hours: "Open - 24 Hours",
    email: "gmr@railway.gov.lk",
    head: "Mr. Jayasundara",
    image: "/station.jpg",
  },
  {
    id: "alut",
    name: "Aluthgama",
    city: "Kalutara",
    desc: "Aluthgama station is a key stop on the coastal line toward the south.",
    phone: "0112434215",
    hours: "Open - 24 Hours",
    email: "gmr@railway.gov.lk",
    head: "Mr. Jayasundara",
    image: "/station.jpg",
  },
];

export const trains = [
  {
    id: "KTS-MDA-1122",
    code: "KTS/MDA-1122",
    routeLine: "Colombo Fort - Aluthgama",
    // for filtering: stops in order
    stops: ["fort", "rath", "pana", "alut"],
    // segment timings (simple for MVP)
    timings: {
      "rath->pana": { depart: "19:05", arrive: "19:45" },
      "fort->alut": { depart: "18:30", arrive: "20:30" },
    },
    etaText: "Arrival Now",
    fares: { first: 60, second: 45, third: 38 },
  },
  {
    id: "MDA-ALT-8742",
    code: "MDA/ALT-8742",
    routeLine: "Galle",
    stops: ["fort", "rath", "pana", "alut"],
    timings: {
      "rath->pana": { depart: "19:15", arrive: "19:55" },
      "fort->alut": { depart: "18:45", arrive: "20:45" },
    },
    etaText: "Arrival in 31mins",
    fares: { first: 65, second: 50, third: 42 },
  },
];