import { Customer } from './types';

export const importedCustomers: Customer[] = [
  {
    "id": "cus_auto_1",
    "kundenNummer": "HUBI1001",
    "name": "Sarah Gruber",
    "email": "sarah.gruber@example.com",
    "phone": "+43 994724363",
    "createdAt": "2025-01-13T19:43:47.913Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah1",
    "address": {
      "street": "Bahnhofstraße 7",
      "city": "Linz",
      "zip": "7884",
      "country": "Österreich"
    },
    "nameLower": "sarah gruber",
    "abholadresse": {
      "strasse": "Bahnhofstraße 7, Linz",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Lindenweg 77, Villach",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_2",
    "kundenNummer": "HUBI1002",
    "name": "Sophie Winkler",
    "email": "sophie.winkler@example.com",
    "phone": "+43 350750202",
    "createdAt": "2026-04-06T13:50:41.344Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie2",
    "address": {
      "street": "Dorfstraße 91",
      "city": "Klagenfurt",
      "zip": "4133",
      "country": "Österreich"
    },
    "nameLower": "sophie winkler",
    "abholadresse": {
      "strasse": "Dorfstraße 91, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Waldstraße 59, Wien",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "3",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_3",
    "kundenNummer": "HUBI1003",
    "name": "Stefan Fuchs",
    "email": "stefan.fuchs@example.com",
    "phone": "+43 286520883",
    "createdAt": "2025-02-16T20:34:05.641Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan3",
    "address": {
      "street": "Hauptstraße 7",
      "city": "St. Pölten",
      "zip": "5661",
      "country": "Österreich"
    },
    "nameLower": "stefan fuchs",
    "abholadresse": {
      "strasse": "Hauptstraße 7, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Feldgasse 11, Graz",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "18",
      "mittlereUmzugskartons": "8",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_4",
    "kundenNummer": "HUBI1004",
    "name": "Lukas Weber",
    "email": "lukas.weber@example.com",
    "phone": "+43 701489542",
    "createdAt": "2025-10-01T10:14:12.176Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas4",
    "address": {
      "street": "Kirchenplatz 40",
      "city": "Innsbruck",
      "zip": "6816",
      "country": "Österreich"
    },
    "nameLower": "lukas weber",
    "abholadresse": {
      "strasse": "Kirchenplatz 40, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 46, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "6",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_5",
    "kundenNummer": "HUBI1005",
    "name": "Laura Gruber",
    "email": "laura.gruber@example.com",
    "phone": "+43 355865160",
    "createdAt": "2025-10-16T23:38:05.359Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura5",
    "address": {
      "street": "Bergstraße 60",
      "city": "Wels",
      "zip": "3197",
      "country": "Österreich"
    },
    "nameLower": "laura gruber",
    "abholadresse": {
      "strasse": "Bergstraße 60, Wels",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Waldstraße 77, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "3",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_6",
    "kundenNummer": "HUBI1006",
    "name": "Anna Reiter",
    "email": "anna.reiter@example.com",
    "phone": "+43 401017851",
    "createdAt": "2026-07-12T08:51:02.103Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna6",
    "address": {
      "street": "Dorfstraße 67",
      "city": "Linz",
      "zip": "8123",
      "country": "Österreich"
    },
    "nameLower": "anna reiter",
    "abholadresse": {
      "strasse": "Dorfstraße 67, Linz",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 8, Salzburg",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_7",
    "kundenNummer": "HUBI1007",
    "name": "Maximilian Pichler",
    "email": "maximilian.pichler@example.com",
    "phone": "+43 252293171",
    "createdAt": "2025-02-09T12:19:01.398Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian7",
    "address": {
      "street": "Lindenweg 22",
      "city": "Wels",
      "zip": "2459",
      "country": "Österreich"
    },
    "nameLower": "maximilian pichler",
    "abholadresse": {
      "strasse": "Lindenweg 22, Wels",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Feldgasse 56, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_8",
    "kundenNummer": "HUBI1008",
    "name": "Sophie Gruber",
    "email": "sophie.gruber@example.com",
    "phone": "+43 283873723",
    "createdAt": "2025-10-12T07:32:56.223Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie8",
    "address": {
      "street": "Hauptstraße 57",
      "city": "Dornbirn",
      "zip": "8350",
      "country": "Österreich"
    },
    "nameLower": "sophie gruber",
    "abholadresse": {
      "strasse": "Hauptstraße 57, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Schulstraße 21, Wien",
      "stockwerk": "4",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_9",
    "kundenNummer": "HUBI1009",
    "name": "Alexander Weber",
    "email": "alexander.weber@example.com",
    "phone": "+43 417099899",
    "createdAt": "2025-03-23T17:14:16.040Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander9",
    "address": {
      "street": "Waldstraße 51",
      "city": "Wels",
      "zip": "9290",
      "country": "Österreich"
    },
    "nameLower": "alexander weber",
    "abholadresse": {
      "strasse": "Waldstraße 51, Wels",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Lindenweg 66, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_10",
    "kundenNummer": "HUBI1010",
    "name": "Andreas Fuchs",
    "email": "andreas.fuchs@example.com",
    "phone": "+43 611058787",
    "createdAt": "2025-08-08T14:37:04.387Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas10",
    "address": {
      "street": "Kirchenplatz 40",
      "city": "Klagenfurt",
      "zip": "8780",
      "country": "Österreich"
    },
    "nameLower": "andreas fuchs",
    "abholadresse": {
      "strasse": "Kirchenplatz 40, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 88, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "12",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_11",
    "kundenNummer": "HUBI1011",
    "name": "Christina Schmid",
    "email": "christina.schmid@example.com",
    "phone": "+43 589714699",
    "createdAt": "2025-07-21T16:56:51.997Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina11",
    "address": {
      "street": "Feldgasse 1",
      "city": "Villach",
      "zip": "6157",
      "country": "Österreich"
    },
    "nameLower": "christina schmid",
    "abholadresse": {
      "strasse": "Feldgasse 1, Villach",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Lindenweg 95, Salzburg",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "24",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_12",
    "kundenNummer": "HUBI1012",
    "name": "Alexander Huber",
    "email": "alexander.huber@example.com",
    "phone": "+43 496100116",
    "createdAt": "2025-01-02T16:39:20.869Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander12",
    "address": {
      "street": "Waldstraße 85",
      "city": "Salzburg",
      "zip": "6532",
      "country": "Österreich"
    },
    "nameLower": "alexander huber",
    "abholadresse": {
      "strasse": "Waldstraße 85, Salzburg",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 79, Graz",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_13",
    "kundenNummer": "HUBI1013",
    "name": "Katharina Berger",
    "email": "katharina.berger@example.com",
    "phone": "+43 817065814",
    "createdAt": "2025-09-10T15:59:57.052Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina13",
    "address": {
      "street": "Hauptstraße 59",
      "city": "Salzburg",
      "zip": "9186",
      "country": "Österreich"
    },
    "nameLower": "katharina berger",
    "abholadresse": {
      "strasse": "Hauptstraße 59, Salzburg",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 10, Villach",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "28",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_14",
    "kundenNummer": "HUBI1014",
    "name": "Stefan Fischer",
    "email": "stefan.fischer@example.com",
    "phone": "+43 515849731",
    "createdAt": "2026-06-11T11:14:07.097Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan14",
    "address": {
      "street": "Kirchenplatz 76",
      "city": "Klagenfurt",
      "zip": "1661",
      "country": "Österreich"
    },
    "nameLower": "stefan fischer",
    "abholadresse": {
      "strasse": "Kirchenplatz 76, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 21, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "12",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_15",
    "kundenNummer": "HUBI1015",
    "name": "Stefan Berger",
    "email": "stefan.berger@example.com",
    "phone": "+43 309461799",
    "createdAt": "2026-07-26T23:24:57.170Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan15",
    "address": {
      "street": "Waldstraße 74",
      "city": "Villach",
      "zip": "3502",
      "country": "Österreich"
    },
    "nameLower": "stefan berger",
    "abholadresse": {
      "strasse": "Waldstraße 74, Villach",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 41, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_16",
    "kundenNummer": "HUBI1016",
    "name": "Julia Weber",
    "email": "julia.weber@example.com",
    "phone": "+43 781581499",
    "createdAt": "2025-01-17T13:13:01.797Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia16",
    "address": {
      "street": "Waldstraße 17",
      "city": "St. Pölten",
      "zip": "3762",
      "country": "Österreich"
    },
    "nameLower": "julia weber",
    "abholadresse": {
      "strasse": "Waldstraße 17, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 93, Wien",
      "stockwerk": "3",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_17",
    "kundenNummer": "HUBI1017",
    "name": "Maximilian Berger",
    "email": "maximilian.berger@example.com",
    "phone": "+43 412253212",
    "createdAt": "2025-09-07T06:58:54.405Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian17",
    "address": {
      "street": "Bergstraße 36",
      "city": "Graz",
      "zip": "2590",
      "country": "Österreich"
    },
    "nameLower": "maximilian berger",
    "abholadresse": {
      "strasse": "Bergstraße 36, Graz",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 37, Linz",
      "stockwerk": "3",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_18",
    "kundenNummer": "HUBI1018",
    "name": "Christina Pichler",
    "email": "christina.pichler@example.com",
    "phone": "+43 299765444",
    "createdAt": "2025-06-18T07:22:18.506Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina18",
    "address": {
      "street": "Kirchenplatz 79",
      "city": "Innsbruck",
      "zip": "7858",
      "country": "Österreich"
    },
    "nameLower": "christina pichler",
    "abholadresse": {
      "strasse": "Kirchenplatz 79, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 89, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "28",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_19",
    "kundenNummer": "HUBI1019",
    "name": "Christina Fischer",
    "email": "christina.fischer@example.com",
    "phone": "+43 796251144",
    "createdAt": "2025-10-06T23:49:06.708Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina19",
    "address": {
      "street": "Wiesenweg 60",
      "city": "Salzburg",
      "zip": "8397",
      "country": "Österreich"
    },
    "nameLower": "christina fischer",
    "abholadresse": {
      "strasse": "Wiesenweg 60, Salzburg",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Feldgasse 27, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "20",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_20",
    "kundenNummer": "HUBI1020",
    "name": "Elena Steiner",
    "email": "elena.steiner@example.com",
    "phone": "+43 521548373",
    "createdAt": "2026-06-02T09:14:59.578Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena20",
    "address": {
      "street": "Bergstraße 78",
      "city": "Salzburg",
      "zip": "2485",
      "country": "Österreich"
    },
    "nameLower": "elena steiner",
    "abholadresse": {
      "strasse": "Bergstraße 78, Salzburg",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Schulstraße 64, Wels",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "22",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_21",
    "kundenNummer": "HUBI1021",
    "name": "Michael Fischer",
    "email": "michael.fischer@example.com",
    "phone": "+43 885646129",
    "createdAt": "2025-07-31T04:06:09.213Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael21",
    "address": {
      "street": "Feldgasse 10",
      "city": "Klagenfurt",
      "zip": "6507",
      "country": "Österreich"
    },
    "nameLower": "michael fischer",
    "abholadresse": {
      "strasse": "Feldgasse 10, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 41, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_22",
    "kundenNummer": "HUBI1022",
    "name": "Thomas Müller",
    "email": "thomas.müller@example.com",
    "phone": "+43 263830609",
    "createdAt": "2026-06-08T23:55:16.845Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas22",
    "address": {
      "street": "Rathausplatz 96",
      "city": "Salzburg",
      "zip": "8387",
      "country": "Österreich"
    },
    "nameLower": "thomas müller",
    "abholadresse": {
      "strasse": "Rathausplatz 96, Salzburg",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bergstraße 7, Graz",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_23",
    "kundenNummer": "HUBI1023",
    "name": "Katharina Weber",
    "email": "katharina.weber@example.com",
    "phone": "+43 345552440",
    "createdAt": "2026-03-06T16:10:24.675Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina23",
    "address": {
      "street": "Dorfstraße 54",
      "city": "Villach",
      "zip": "3029",
      "country": "Österreich"
    },
    "nameLower": "katharina weber",
    "abholadresse": {
      "strasse": "Dorfstraße 54, Villach",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 87, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_24",
    "kundenNummer": "HUBI1024",
    "name": "Christian Bauer",
    "email": "christian.bauer@example.com",
    "phone": "+43 461851983",
    "createdAt": "2026-01-07T04:16:56.280Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian24",
    "address": {
      "street": "Dorfstraße 89",
      "city": "St. Pölten",
      "zip": "2929",
      "country": "Österreich"
    },
    "nameLower": "christian bauer",
    "abholadresse": {
      "strasse": "Dorfstraße 89, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Schulstraße 78, Wien",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_25",
    "kundenNummer": "HUBI1025",
    "name": "Thomas Schmidt",
    "email": "thomas.schmidt@example.com",
    "phone": "+43 293133328",
    "createdAt": "2026-03-20T19:17:33.037Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas25",
    "address": {
      "street": "Feldgasse 90",
      "city": "Wien",
      "zip": "1195",
      "country": "Österreich"
    },
    "nameLower": "thomas schmidt",
    "abholadresse": {
      "strasse": "Feldgasse 90, Wien",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 22, Linz",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "12",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_26",
    "kundenNummer": "HUBI1026",
    "name": "Andreas Moser",
    "email": "andreas.moser@example.com",
    "phone": "+43 872229314",
    "createdAt": "2025-11-25T04:39:56.781Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas26",
    "address": {
      "street": "Rathausplatz 47",
      "city": "Innsbruck",
      "zip": "4683",
      "country": "Österreich"
    },
    "nameLower": "andreas moser",
    "abholadresse": {
      "strasse": "Rathausplatz 47, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Feldgasse 70, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_27",
    "kundenNummer": "HUBI1027",
    "name": "Martin Pichler",
    "email": "martin.pichler@example.com",
    "phone": "+43 587103418",
    "createdAt": "2026-06-12T17:31:19.981Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin27",
    "address": {
      "street": "Schulstraße 88",
      "city": "Wels",
      "zip": "3566",
      "country": "Österreich"
    },
    "nameLower": "martin pichler",
    "abholadresse": {
      "strasse": "Schulstraße 88, Wels",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Feldgasse 96, Innsbruck",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "2",
      "mittlereUmzugskartons": "23",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_28",
    "kundenNummer": "HUBI1028",
    "name": "Lukas Schmid",
    "email": "lukas.schmid@example.com",
    "phone": "+43 894336993",
    "createdAt": "2026-01-20T15:58:33.640Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas28",
    "address": {
      "street": "Lindenweg 10",
      "city": "Dornbirn",
      "zip": "2539",
      "country": "Österreich"
    },
    "nameLower": "lukas schmid",
    "abholadresse": {
      "strasse": "Lindenweg 10, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Schulstraße 75, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_29",
    "kundenNummer": "HUBI1029",
    "name": "Maria Hofer",
    "email": "maria.hofer@example.com",
    "phone": "+43 467253269",
    "createdAt": "2026-04-22T17:57:00.156Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria29",
    "address": {
      "street": "Gartenstraße 61",
      "city": "St. Pölten",
      "zip": "6449",
      "country": "Österreich"
    },
    "nameLower": "maria hofer",
    "abholadresse": {
      "strasse": "Gartenstraße 61, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 1, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_30",
    "kundenNummer": "HUBI1030",
    "name": "Stefan Fuchs",
    "email": "stefan.fuchs@example.com",
    "phone": "+43 434100827",
    "createdAt": "2026-05-25T10:45:36.887Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan30",
    "address": {
      "street": "Schulstraße 89",
      "city": "Villach",
      "zip": "6976",
      "country": "Österreich"
    },
    "nameLower": "stefan fuchs",
    "abholadresse": {
      "strasse": "Schulstraße 89, Villach",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bergstraße 96, Linz",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "2",
      "mittlereUmzugskartons": "7",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_31",
    "kundenNummer": "HUBI1031",
    "name": "David Müller",
    "email": "david.müller@example.com",
    "phone": "+43 317919075",
    "createdAt": "2026-07-14T18:47:29.469Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David31",
    "address": {
      "street": "Lindenweg 31",
      "city": "Wels",
      "zip": "8242",
      "country": "Österreich"
    },
    "nameLower": "david müller",
    "abholadresse": {
      "strasse": "Lindenweg 31, Wels",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 22, Innsbruck",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "23",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_32",
    "kundenNummer": "HUBI1032",
    "name": "Thomas Huber",
    "email": "thomas.huber@example.com",
    "phone": "+43 714800439",
    "createdAt": "2025-05-04T11:53:46.106Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas32",
    "address": {
      "street": "Bahnhofstraße 54",
      "city": "Innsbruck",
      "zip": "6735",
      "country": "Österreich"
    },
    "nameLower": "thomas huber",
    "abholadresse": {
      "strasse": "Bahnhofstraße 54, Innsbruck",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 18, Salzburg",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "20",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_33",
    "kundenNummer": "HUBI1033",
    "name": "Stefan Fuchs",
    "email": "stefan.fuchs@example.com",
    "phone": "+43 466917508",
    "createdAt": "2025-08-22T21:28:27.090Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan33",
    "address": {
      "street": "Rathausplatz 22",
      "city": "Graz",
      "zip": "4399",
      "country": "Österreich"
    },
    "nameLower": "stefan fuchs",
    "abholadresse": {
      "strasse": "Rathausplatz 22, Graz",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Schulstraße 13, Linz",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "21",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_34",
    "kundenNummer": "HUBI1034",
    "name": "Alexander Koch",
    "email": "alexander.koch@example.com",
    "phone": "+43 882697505",
    "createdAt": "2026-04-18T06:14:40.811Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander34",
    "address": {
      "street": "Waldstraße 9",
      "city": "St. Pölten",
      "zip": "9029",
      "country": "Österreich"
    },
    "nameLower": "alexander koch",
    "abholadresse": {
      "strasse": "Waldstraße 9, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 15, Villach",
      "stockwerk": "2",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_35",
    "kundenNummer": "HUBI1035",
    "name": "Laura Reiter",
    "email": "laura.reiter@example.com",
    "phone": "+43 163083581",
    "createdAt": "2025-05-08T03:06:05.056Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura35",
    "address": {
      "street": "Dorfstraße 45",
      "city": "Wien",
      "zip": "8505",
      "country": "Österreich"
    },
    "nameLower": "laura reiter",
    "abholadresse": {
      "strasse": "Dorfstraße 45, Wien",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 70, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "4",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_36",
    "kundenNummer": "HUBI1036",
    "name": "Elena Pichler",
    "email": "elena.pichler@example.com",
    "phone": "+43 760525788",
    "createdAt": "2025-04-09T20:05:15.545Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena36",
    "address": {
      "street": "Bahnhofstraße 8",
      "city": "Graz",
      "zip": "9165",
      "country": "Österreich"
    },
    "nameLower": "elena pichler",
    "abholadresse": {
      "strasse": "Bahnhofstraße 8, Graz",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bergstraße 92, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "11",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_37",
    "kundenNummer": "HUBI1037",
    "name": "Alexander Bauer",
    "email": "alexander.bauer@example.com",
    "phone": "+43 455052688",
    "createdAt": "2026-02-08T09:28:11.574Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander37",
    "address": {
      "street": "Feldgasse 56",
      "city": "Salzburg",
      "zip": "7592",
      "country": "Österreich"
    },
    "nameLower": "alexander bauer",
    "abholadresse": {
      "strasse": "Feldgasse 56, Salzburg",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 33, Wels",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "7",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_38",
    "kundenNummer": "HUBI1038",
    "name": "Maria Schmid",
    "email": "maria.schmid@example.com",
    "phone": "+43 742892363",
    "createdAt": "2026-02-14T16:07:39.961Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria38",
    "address": {
      "street": "Wiesenweg 20",
      "city": "Wels",
      "zip": "3992",
      "country": "Österreich"
    },
    "nameLower": "maria schmid",
    "abholadresse": {
      "strasse": "Wiesenweg 20, Wels",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Schulstraße 77, Graz",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "9",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_39",
    "kundenNummer": "HUBI1039",
    "name": "Stefan Bauer",
    "email": "stefan.bauer@example.com",
    "phone": "+43 239448077",
    "createdAt": "2025-05-20T07:24:41.489Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan39",
    "address": {
      "street": "Waldstraße 66",
      "city": "Wien",
      "zip": "9230",
      "country": "Österreich"
    },
    "nameLower": "stefan bauer",
    "abholadresse": {
      "strasse": "Waldstraße 66, Wien",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Feldgasse 89, Graz",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "4",
      "mittlereUmzugskartons": "8",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_40",
    "kundenNummer": "HUBI1040",
    "name": "Alexander Berger",
    "email": "alexander.berger@example.com",
    "phone": "+43 866485031",
    "createdAt": "2026-06-30T05:45:29.399Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander40",
    "address": {
      "street": "Dorfstraße 23",
      "city": "Klagenfurt",
      "zip": "2549",
      "country": "Österreich"
    },
    "nameLower": "alexander berger",
    "abholadresse": {
      "strasse": "Dorfstraße 23, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 97, Wien",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "21",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_41",
    "kundenNummer": "HUBI1041",
    "name": "David Wagner",
    "email": "david.wagner@example.com",
    "phone": "+43 264986034",
    "createdAt": "2025-06-01T03:40:25.384Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David41",
    "address": {
      "street": "Rathausplatz 42",
      "city": "Villach",
      "zip": "7516",
      "country": "Österreich"
    },
    "nameLower": "david wagner",
    "abholadresse": {
      "strasse": "Rathausplatz 42, Villach",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 8, Salzburg",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "15",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_42",
    "kundenNummer": "HUBI1042",
    "name": "Katharina Steiner",
    "email": "katharina.steiner@example.com",
    "phone": "+43 978238231",
    "createdAt": "2025-03-02T21:15:40.068Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina42",
    "address": {
      "street": "Rathausplatz 40",
      "city": "St. Pölten",
      "zip": "7387",
      "country": "Österreich"
    },
    "nameLower": "katharina steiner",
    "abholadresse": {
      "strasse": "Rathausplatz 40, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 41, Villach",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "27",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_43",
    "kundenNummer": "HUBI1043",
    "name": "Christian Winkler",
    "email": "christian.winkler@example.com",
    "phone": "+43 454266725",
    "createdAt": "2026-01-13T21:53:28.393Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian43",
    "address": {
      "street": "Wiesenweg 66",
      "city": "Villach",
      "zip": "8848",
      "country": "Österreich"
    },
    "nameLower": "christian winkler",
    "abholadresse": {
      "strasse": "Wiesenweg 66, Villach",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 45, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_44",
    "kundenNummer": "HUBI1044",
    "name": "Andreas Koch",
    "email": "andreas.koch@example.com",
    "phone": "+43 906046530",
    "createdAt": "2026-07-26T20:27:41.674Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas44",
    "address": {
      "street": "Kirchenplatz 36",
      "city": "Linz",
      "zip": "8294",
      "country": "Österreich"
    },
    "nameLower": "andreas koch",
    "abholadresse": {
      "strasse": "Kirchenplatz 36, Linz",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Waldstraße 46, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "29",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_45",
    "kundenNummer": "HUBI1045",
    "name": "Stefan Fuchs",
    "email": "stefan.fuchs@example.com",
    "phone": "+43 937119787",
    "createdAt": "2025-06-06T05:16:21.059Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan45",
    "address": {
      "street": "Wiesenweg 9",
      "city": "Villach",
      "zip": "1130",
      "country": "Österreich"
    },
    "nameLower": "stefan fuchs",
    "abholadresse": {
      "strasse": "Wiesenweg 9, Villach",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Waldstraße 52, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "10",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_46",
    "kundenNummer": "HUBI1046",
    "name": "Elena Hofer",
    "email": "elena.hofer@example.com",
    "phone": "+43 398861574",
    "createdAt": "2026-07-29T03:02:24.118Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena46",
    "address": {
      "street": "Waldstraße 86",
      "city": "Linz",
      "zip": "9651",
      "country": "Österreich"
    },
    "nameLower": "elena hofer",
    "abholadresse": {
      "strasse": "Waldstraße 86, Linz",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 93, Salzburg",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_47",
    "kundenNummer": "HUBI1047",
    "name": "Lukas Bauer",
    "email": "lukas.bauer@example.com",
    "phone": "+43 353962302",
    "createdAt": "2025-11-27T02:41:29.816Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas47",
    "address": {
      "street": "Rathausplatz 40",
      "city": "Innsbruck",
      "zip": "1941",
      "country": "Österreich"
    },
    "nameLower": "lukas bauer",
    "abholadresse": {
      "strasse": "Rathausplatz 40, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Lindenweg 86, Wien",
      "stockwerk": "4",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_48",
    "kundenNummer": "HUBI1048",
    "name": "Katharina Mayer",
    "email": "katharina.mayer@example.com",
    "phone": "+43 152122426",
    "createdAt": "2025-06-03T13:05:17.520Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina48",
    "address": {
      "street": "Gartenstraße 22",
      "city": "Wien",
      "zip": "2407",
      "country": "Österreich"
    },
    "nameLower": "katharina mayer",
    "abholadresse": {
      "strasse": "Gartenstraße 22, Wien",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 88, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_49",
    "kundenNummer": "HUBI1049",
    "name": "Maria Gruber",
    "email": "maria.gruber@example.com",
    "phone": "+43 190125536",
    "createdAt": "2026-06-06T18:42:54.957Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria49",
    "address": {
      "street": "Waldstraße 47",
      "city": "Villach",
      "zip": "1495",
      "country": "Österreich"
    },
    "nameLower": "maria gruber",
    "abholadresse": {
      "strasse": "Waldstraße 47, Villach",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 84, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "2",
      "mittlereUmzugskartons": "2",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_50",
    "kundenNummer": "HUBI1050",
    "name": "Katharina Mayer",
    "email": "katharina.mayer@example.com",
    "phone": "+43 206496462",
    "createdAt": "2026-04-17T02:13:50.728Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina50",
    "address": {
      "street": "Feldgasse 61",
      "city": "St. Pölten",
      "zip": "1319",
      "country": "Österreich"
    },
    "nameLower": "katharina mayer",
    "abholadresse": {
      "strasse": "Feldgasse 61, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 8, Villach",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "4",
      "mittlereUmzugskartons": "8",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_51",
    "kundenNummer": "HUBI1051",
    "name": "Lukas Mayer",
    "email": "lukas.mayer@example.com",
    "phone": "+43 617197525",
    "createdAt": "2025-08-28T09:20:57.644Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas51",
    "address": {
      "street": "Feldgasse 86",
      "city": "Wien",
      "zip": "9732",
      "country": "Österreich"
    },
    "nameLower": "lukas mayer",
    "abholadresse": {
      "strasse": "Feldgasse 86, Wien",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 12, Wien",
      "stockwerk": "4",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_52",
    "kundenNummer": "HUBI1052",
    "name": "Anna Wagner",
    "email": "anna.wagner@example.com",
    "phone": "+43 923532699",
    "createdAt": "2025-03-07T14:34:42.432Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna52",
    "address": {
      "street": "Dorfstraße 86",
      "city": "Dornbirn",
      "zip": "7125",
      "country": "Österreich"
    },
    "nameLower": "anna wagner",
    "abholadresse": {
      "strasse": "Dorfstraße 86, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 10, Salzburg",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "11",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_53",
    "kundenNummer": "HUBI1053",
    "name": "Laura Eder",
    "email": "laura.eder@example.com",
    "phone": "+43 522764258",
    "createdAt": "2026-06-23T02:10:54.563Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura53",
    "address": {
      "street": "Kirchenplatz 58",
      "city": "Salzburg",
      "zip": "4451",
      "country": "Österreich"
    },
    "nameLower": "laura eder",
    "abholadresse": {
      "strasse": "Kirchenplatz 58, Salzburg",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 7, Wels",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "13",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_54",
    "kundenNummer": "HUBI1054",
    "name": "Alexander Gruber",
    "email": "alexander.gruber@example.com",
    "phone": "+43 433668368",
    "createdAt": "2025-11-28T08:46:44.597Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander54",
    "address": {
      "street": "Bahnhofstraße 11",
      "city": "Innsbruck",
      "zip": "9367",
      "country": "Österreich"
    },
    "nameLower": "alexander gruber",
    "abholadresse": {
      "strasse": "Bahnhofstraße 11, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 93, Salzburg",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "4",
      "mittlereUmzugskartons": "20",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_55",
    "kundenNummer": "HUBI1055",
    "name": "Lukas Pichler",
    "email": "lukas.pichler@example.com",
    "phone": "+43 309789145",
    "createdAt": "2025-09-26T23:20:02.369Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas55",
    "address": {
      "street": "Rathausplatz 19",
      "city": "Dornbirn",
      "zip": "8822",
      "country": "Österreich"
    },
    "nameLower": "lukas pichler",
    "abholadresse": {
      "strasse": "Rathausplatz 19, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 49, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "24",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_56",
    "kundenNummer": "HUBI1056",
    "name": "Julia Schmidt",
    "email": "julia.schmidt@example.com",
    "phone": "+43 846850103",
    "createdAt": "2025-01-01T08:24:10.966Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia56",
    "address": {
      "street": "Rathausplatz 97",
      "city": "Linz",
      "zip": "1512",
      "country": "Österreich"
    },
    "nameLower": "julia schmidt",
    "abholadresse": {
      "strasse": "Rathausplatz 97, Linz",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Lindenweg 88, Graz",
      "stockwerk": "3",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_57",
    "kundenNummer": "HUBI1057",
    "name": "Christina Huber",
    "email": "christina.huber@example.com",
    "phone": "+43 638886065",
    "createdAt": "2025-08-17T11:33:00.128Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina57",
    "address": {
      "street": "Hauptstraße 12",
      "city": "Innsbruck",
      "zip": "7050",
      "country": "Österreich"
    },
    "nameLower": "christina huber",
    "abholadresse": {
      "strasse": "Hauptstraße 12, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Schulstraße 95, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "24",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_58",
    "kundenNummer": "HUBI1058",
    "name": "Julia Moser",
    "email": "julia.moser@example.com",
    "phone": "+43 219526502",
    "createdAt": "2025-05-03T19:54:33.055Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia58",
    "address": {
      "street": "Dorfstraße 64",
      "city": "Klagenfurt",
      "zip": "7869",
      "country": "Österreich"
    },
    "nameLower": "julia moser",
    "abholadresse": {
      "strasse": "Dorfstraße 64, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Feldgasse 44, Linz",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "22",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_59",
    "kundenNummer": "HUBI1059",
    "name": "Katharina Hofer",
    "email": "katharina.hofer@example.com",
    "phone": "+43 588117992",
    "createdAt": "2026-05-22T19:27:29.133Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina59",
    "address": {
      "street": "Hauptstraße 43",
      "city": "Salzburg",
      "zip": "2962",
      "country": "Österreich"
    },
    "nameLower": "katharina hofer",
    "abholadresse": {
      "strasse": "Hauptstraße 43, Salzburg",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Feldgasse 37, Wels",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "1",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_60",
    "kundenNummer": "HUBI1060",
    "name": "Alexander Eder",
    "email": "alexander.eder@example.com",
    "phone": "+43 583560877",
    "createdAt": "2026-07-16T09:09:09.977Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander60",
    "address": {
      "street": "Gartenstraße 41",
      "city": "St. Pölten",
      "zip": "8643",
      "country": "Österreich"
    },
    "nameLower": "alexander eder",
    "abholadresse": {
      "strasse": "Gartenstraße 41, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 49, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "10",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_61",
    "kundenNummer": "HUBI1061",
    "name": "Sarah Fischer",
    "email": "sarah.fischer@example.com",
    "phone": "+43 864072796",
    "createdAt": "2025-06-25T17:11:13.313Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah61",
    "address": {
      "street": "Bahnhofstraße 29",
      "city": "Wien",
      "zip": "5532",
      "country": "Österreich"
    },
    "nameLower": "sarah fischer",
    "abholadresse": {
      "strasse": "Bahnhofstraße 29, Wien",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bergstraße 23, Wien",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "14",
      "mittlereUmzugskartons": "12",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_62",
    "kundenNummer": "HUBI1062",
    "name": "Maximilian Schmidt",
    "email": "maximilian.schmidt@example.com",
    "phone": "+43 743044931",
    "createdAt": "2025-07-24T17:39:01.492Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian62",
    "address": {
      "street": "Lindenweg 88",
      "city": "Salzburg",
      "zip": "8095",
      "country": "Österreich"
    },
    "nameLower": "maximilian schmidt",
    "abholadresse": {
      "strasse": "Lindenweg 88, Salzburg",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bergstraße 36, Wien",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "0",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_63",
    "kundenNummer": "HUBI1063",
    "name": "Michael Reiter",
    "email": "michael.reiter@example.com",
    "phone": "+43 510266257",
    "createdAt": "2026-03-15T21:29:42.373Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael63",
    "address": {
      "street": "Bergstraße 20",
      "city": "Salzburg",
      "zip": "1086",
      "country": "Österreich"
    },
    "nameLower": "michael reiter",
    "abholadresse": {
      "strasse": "Bergstraße 20, Salzburg",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 68, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "12",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_64",
    "kundenNummer": "HUBI1064",
    "name": "Sophie Koch",
    "email": "sophie.koch@example.com",
    "phone": "+43 256855263",
    "createdAt": "2025-07-24T04:24:46.749Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie64",
    "address": {
      "street": "Dorfstraße 71",
      "city": "Linz",
      "zip": "3420",
      "country": "Österreich"
    },
    "nameLower": "sophie koch",
    "abholadresse": {
      "strasse": "Dorfstraße 71, Linz",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bergstraße 93, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_65",
    "kundenNummer": "HUBI1065",
    "name": "Martin Wagner",
    "email": "martin.wagner@example.com",
    "phone": "+43 626666962",
    "createdAt": "2025-05-03T00:53:19.147Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin65",
    "address": {
      "street": "Feldgasse 43",
      "city": "Innsbruck",
      "zip": "2644",
      "country": "Österreich"
    },
    "nameLower": "martin wagner",
    "abholadresse": {
      "strasse": "Feldgasse 43, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 44, Wien",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "3",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_66",
    "kundenNummer": "HUBI1066",
    "name": "Maximilian Schmidt",
    "email": "maximilian.schmidt@example.com",
    "phone": "+43 226411684",
    "createdAt": "2025-04-29T18:59:30.211Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian66",
    "address": {
      "street": "Bergstraße 99",
      "city": "Dornbirn",
      "zip": "6108",
      "country": "Österreich"
    },
    "nameLower": "maximilian schmidt",
    "abholadresse": {
      "strasse": "Bergstraße 99, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 49, Innsbruck",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "5",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_67",
    "kundenNummer": "HUBI1067",
    "name": "Andreas Huber",
    "email": "andreas.huber@example.com",
    "phone": "+43 675536756",
    "createdAt": "2026-04-19T10:39:18.493Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas67",
    "address": {
      "street": "Lindenweg 99",
      "city": "Dornbirn",
      "zip": "5809",
      "country": "Österreich"
    },
    "nameLower": "andreas huber",
    "abholadresse": {
      "strasse": "Lindenweg 99, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 83, Wien",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_68",
    "kundenNummer": "HUBI1068",
    "name": "Maria Bauer",
    "email": "maria.bauer@example.com",
    "phone": "+43 846566404",
    "createdAt": "2026-06-13T18:17:59.958Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria68",
    "address": {
      "street": "Feldgasse 54",
      "city": "Wels",
      "zip": "3720",
      "country": "Österreich"
    },
    "nameLower": "maria bauer",
    "abholadresse": {
      "strasse": "Feldgasse 54, Wels",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 77, Graz",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "14",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_69",
    "kundenNummer": "HUBI1069",
    "name": "Stefan Müller",
    "email": "stefan.müller@example.com",
    "phone": "+43 632887764",
    "createdAt": "2025-05-18T20:56:02.080Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan69",
    "address": {
      "street": "Rathausplatz 11",
      "city": "Innsbruck",
      "zip": "7157",
      "country": "Österreich"
    },
    "nameLower": "stefan müller",
    "abholadresse": {
      "strasse": "Rathausplatz 11, Innsbruck",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bergstraße 66, Villach",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "12",
      "mittlereUmzugskartons": "12",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_70",
    "kundenNummer": "HUBI1070",
    "name": "Christina Moser",
    "email": "christina.moser@example.com",
    "phone": "+43 848257447",
    "createdAt": "2025-11-09T04:52:38.659Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina70",
    "address": {
      "street": "Rathausplatz 15",
      "city": "Wels",
      "zip": "7339",
      "country": "Österreich"
    },
    "nameLower": "christina moser",
    "abholadresse": {
      "strasse": "Rathausplatz 15, Wels",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Lindenweg 54, Graz",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "12",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_71",
    "kundenNummer": "HUBI1071",
    "name": "Elena Schmidt",
    "email": "elena.schmidt@example.com",
    "phone": "+43 929305616",
    "createdAt": "2026-07-07T11:30:40.310Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena71",
    "address": {
      "street": "Hauptstraße 69",
      "city": "Innsbruck",
      "zip": "1419",
      "country": "Österreich"
    },
    "nameLower": "elena schmidt",
    "abholadresse": {
      "strasse": "Hauptstraße 69, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 46, Graz",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "14",
      "mittlereUmzugskartons": "24",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_72",
    "kundenNummer": "HUBI1072",
    "name": "Elena Koch",
    "email": "elena.koch@example.com",
    "phone": "+43 388193158",
    "createdAt": "2025-07-07T11:25:13.858Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena72",
    "address": {
      "street": "Gartenstraße 95",
      "city": "Wien",
      "zip": "7399",
      "country": "Österreich"
    },
    "nameLower": "elena koch",
    "abholadresse": {
      "strasse": "Gartenstraße 95, Wien",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Schulstraße 95, Salzburg",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "13",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_73",
    "kundenNummer": "HUBI1073",
    "name": "Maria Fuchs",
    "email": "maria.fuchs@example.com",
    "phone": "+43 938558728",
    "createdAt": "2025-04-30T17:31:36.803Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria73",
    "address": {
      "street": "Bahnhofstraße 29",
      "city": "Linz",
      "zip": "1532",
      "country": "Österreich"
    },
    "nameLower": "maria fuchs",
    "abholadresse": {
      "strasse": "Bahnhofstraße 29, Linz",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 30, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "0",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_74",
    "kundenNummer": "HUBI1074",
    "name": "Christian Winkler",
    "email": "christian.winkler@example.com",
    "phone": "+43 962198078",
    "createdAt": "2025-05-02T04:01:24.670Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian74",
    "address": {
      "street": "Gartenstraße 28",
      "city": "Wien",
      "zip": "9356",
      "country": "Österreich"
    },
    "nameLower": "christian winkler",
    "abholadresse": {
      "strasse": "Gartenstraße 28, Wien",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 83, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_75",
    "kundenNummer": "HUBI1075",
    "name": "Thomas Pichler",
    "email": "thomas.pichler@example.com",
    "phone": "+43 528814681",
    "createdAt": "2025-05-24T00:37:48.603Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas75",
    "address": {
      "street": "Dorfstraße 92",
      "city": "Dornbirn",
      "zip": "1977",
      "country": "Österreich"
    },
    "nameLower": "thomas pichler",
    "abholadresse": {
      "strasse": "Dorfstraße 92, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 1, Villach",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "13",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_76",
    "kundenNummer": "HUBI1076",
    "name": "Maximilian Mayer",
    "email": "maximilian.mayer@example.com",
    "phone": "+43 354166410",
    "createdAt": "2025-07-25T19:10:25.389Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian76",
    "address": {
      "street": "Waldstraße 32",
      "city": "Klagenfurt",
      "zip": "4300",
      "country": "Österreich"
    },
    "nameLower": "maximilian mayer",
    "abholadresse": {
      "strasse": "Waldstraße 32, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 54, Graz",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "0",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_77",
    "kundenNummer": "HUBI1077",
    "name": "Maria Schmid",
    "email": "maria.schmid@example.com",
    "phone": "+43 484777329",
    "createdAt": "2025-04-28T03:33:59.749Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria77",
    "address": {
      "street": "Lindenweg 11",
      "city": "St. Pölten",
      "zip": "6901",
      "country": "Österreich"
    },
    "nameLower": "maria schmid",
    "abholadresse": {
      "strasse": "Lindenweg 11, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Feldgasse 35, Wels",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "20",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_78",
    "kundenNummer": "HUBI1078",
    "name": "Julia Moser",
    "email": "julia.moser@example.com",
    "phone": "+43 877700992",
    "createdAt": "2025-07-01T06:50:38.901Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia78",
    "address": {
      "street": "Lindenweg 97",
      "city": "Villach",
      "zip": "8821",
      "country": "Österreich"
    },
    "nameLower": "julia moser",
    "abholadresse": {
      "strasse": "Lindenweg 97, Villach",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Waldstraße 85, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_79",
    "kundenNummer": "HUBI1079",
    "name": "Lukas Fuchs",
    "email": "lukas.fuchs@example.com",
    "phone": "+43 676187853",
    "createdAt": "2025-12-12T15:52:54.179Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas79",
    "address": {
      "street": "Bahnhofstraße 42",
      "city": "St. Pölten",
      "zip": "6620",
      "country": "Österreich"
    },
    "nameLower": "lukas fuchs",
    "abholadresse": {
      "strasse": "Bahnhofstraße 42, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 28, Linz",
      "stockwerk": "3",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_80",
    "kundenNummer": "HUBI1080",
    "name": "Elena Schmid",
    "email": "elena.schmid@example.com",
    "phone": "+43 452953623",
    "createdAt": "2025-11-01T07:53:28.842Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena80",
    "address": {
      "street": "Hauptstraße 80",
      "city": "Innsbruck",
      "zip": "9619",
      "country": "Österreich"
    },
    "nameLower": "elena schmid",
    "abholadresse": {
      "strasse": "Hauptstraße 80, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 39, Wels",
      "stockwerk": "4",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_81",
    "kundenNummer": "HUBI1081",
    "name": "Christian Steiner",
    "email": "christian.steiner@example.com",
    "phone": "+43 730637221",
    "createdAt": "2026-07-25T19:53:23.615Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian81",
    "address": {
      "street": "Kirchenplatz 24",
      "city": "Villach",
      "zip": "2244",
      "country": "Österreich"
    },
    "nameLower": "christian steiner",
    "abholadresse": {
      "strasse": "Kirchenplatz 24, Villach",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Lindenweg 57, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_82",
    "kundenNummer": "HUBI1082",
    "name": "Lukas Fuchs",
    "email": "lukas.fuchs@example.com",
    "phone": "+43 933581411",
    "createdAt": "2025-12-28T08:40:48.514Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas82",
    "address": {
      "street": "Hauptstraße 65",
      "city": "Graz",
      "zip": "7106",
      "country": "Österreich"
    },
    "nameLower": "lukas fuchs",
    "abholadresse": {
      "strasse": "Hauptstraße 65, Graz",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 45, Linz",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "23",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_83",
    "kundenNummer": "HUBI1083",
    "name": "Alexander Winkler",
    "email": "alexander.winkler@example.com",
    "phone": "+43 243205211",
    "createdAt": "2025-09-28T04:38:39.022Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander83",
    "address": {
      "street": "Schulstraße 65",
      "city": "Klagenfurt",
      "zip": "7815",
      "country": "Österreich"
    },
    "nameLower": "alexander winkler",
    "abholadresse": {
      "strasse": "Schulstraße 65, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Lindenweg 79, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "19",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_84",
    "kundenNummer": "HUBI1084",
    "name": "Laura Fischer",
    "email": "laura.fischer@example.com",
    "phone": "+43 283841078",
    "createdAt": "2025-11-10T08:48:11.434Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura84",
    "address": {
      "street": "Dorfstraße 9",
      "city": "Innsbruck",
      "zip": "7164",
      "country": "Österreich"
    },
    "nameLower": "laura fischer",
    "abholadresse": {
      "strasse": "Dorfstraße 9, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Schulstraße 49, Wien",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "2",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_85",
    "kundenNummer": "HUBI1085",
    "name": "Lukas Fuchs",
    "email": "lukas.fuchs@example.com",
    "phone": "+43 971874402",
    "createdAt": "2026-06-05T19:48:25.063Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas85",
    "address": {
      "street": "Feldgasse 24",
      "city": "Wien",
      "zip": "7673",
      "country": "Österreich"
    },
    "nameLower": "lukas fuchs",
    "abholadresse": {
      "strasse": "Feldgasse 24, Wien",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 93, Graz",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "23",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_86",
    "kundenNummer": "HUBI1086",
    "name": "Julia Huber",
    "email": "julia.huber@example.com",
    "phone": "+43 597552002",
    "createdAt": "2025-08-06T02:03:39.193Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia86",
    "address": {
      "street": "Schulstraße 68",
      "city": "Wien",
      "zip": "5844",
      "country": "Österreich"
    },
    "nameLower": "julia huber",
    "abholadresse": {
      "strasse": "Schulstraße 68, Wien",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bergstraße 54, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_87",
    "kundenNummer": "HUBI1087",
    "name": "Lisa Koch",
    "email": "lisa.koch@example.com",
    "phone": "+43 648967321",
    "createdAt": "2026-03-31T17:57:24.352Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa87",
    "address": {
      "street": "Gartenstraße 78",
      "city": "Klagenfurt",
      "zip": "8849",
      "country": "Österreich"
    },
    "nameLower": "lisa koch",
    "abholadresse": {
      "strasse": "Gartenstraße 78, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 13, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "24",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_88",
    "kundenNummer": "HUBI1088",
    "name": "Alexander Schmidt",
    "email": "alexander.schmidt@example.com",
    "phone": "+43 627479808",
    "createdAt": "2025-06-17T12:13:56.598Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander88",
    "address": {
      "street": "Wiesenweg 60",
      "city": "St. Pölten",
      "zip": "1279",
      "country": "Österreich"
    },
    "nameLower": "alexander schmidt",
    "abholadresse": {
      "strasse": "Wiesenweg 60, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 87, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_89",
    "kundenNummer": "HUBI1089",
    "name": "Anna Gruber",
    "email": "anna.gruber@example.com",
    "phone": "+43 816123384",
    "createdAt": "2025-03-27T01:33:13.077Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna89",
    "address": {
      "street": "Feldgasse 53",
      "city": "Klagenfurt",
      "zip": "3927",
      "country": "Österreich"
    },
    "nameLower": "anna gruber",
    "abholadresse": {
      "strasse": "Feldgasse 53, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Waldstraße 82, Wels",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "3",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_90",
    "kundenNummer": "HUBI1090",
    "name": "Elena Hofer",
    "email": "elena.hofer@example.com",
    "phone": "+43 251291616",
    "createdAt": "2025-10-13T09:02:34.342Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena90",
    "address": {
      "street": "Lindenweg 18",
      "city": "Dornbirn",
      "zip": "7860",
      "country": "Österreich"
    },
    "nameLower": "elena hofer",
    "abholadresse": {
      "strasse": "Lindenweg 18, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 81, Salzburg",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "22",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_91",
    "kundenNummer": "HUBI1091",
    "name": "Elena Steiner",
    "email": "elena.steiner@example.com",
    "phone": "+43 487220871",
    "createdAt": "2025-12-17T20:59:46.531Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena91",
    "address": {
      "street": "Rathausplatz 9",
      "city": "Dornbirn",
      "zip": "6144",
      "country": "Österreich"
    },
    "nameLower": "elena steiner",
    "abholadresse": {
      "strasse": "Rathausplatz 9, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 34, Salzburg",
      "stockwerk": "4",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_92",
    "kundenNummer": "HUBI1092",
    "name": "Thomas Gruber",
    "email": "thomas.gruber@example.com",
    "phone": "+43 151595840",
    "createdAt": "2026-01-11T00:41:09.445Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas92",
    "address": {
      "street": "Waldstraße 85",
      "city": "Innsbruck",
      "zip": "7827",
      "country": "Österreich"
    },
    "nameLower": "thomas gruber",
    "abholadresse": {
      "strasse": "Waldstraße 85, Innsbruck",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 89, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_93",
    "kundenNummer": "HUBI1093",
    "name": "Laura Weber",
    "email": "laura.weber@example.com",
    "phone": "+43 575067195",
    "createdAt": "2025-12-06T10:20:55.145Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura93",
    "address": {
      "street": "Rathausplatz 29",
      "city": "Salzburg",
      "zip": "4532",
      "country": "Österreich"
    },
    "nameLower": "laura weber",
    "abholadresse": {
      "strasse": "Rathausplatz 29, Salzburg",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bergstraße 47, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_94",
    "kundenNummer": "HUBI1094",
    "name": "Elena Reiter",
    "email": "elena.reiter@example.com",
    "phone": "+43 591931823",
    "createdAt": "2025-11-30T18:11:50.386Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena94",
    "address": {
      "street": "Lindenweg 31",
      "city": "Linz",
      "zip": "3307",
      "country": "Österreich"
    },
    "nameLower": "elena reiter",
    "abholadresse": {
      "strasse": "Lindenweg 31, Linz",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Waldstraße 99, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "1",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_95",
    "kundenNummer": "HUBI1095",
    "name": "Maximilian Wagner",
    "email": "maximilian.wagner@example.com",
    "phone": "+43 218642735",
    "createdAt": "2025-07-05T17:18:32.140Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian95",
    "address": {
      "street": "Dorfstraße 32",
      "city": "Wels",
      "zip": "4065",
      "country": "Österreich"
    },
    "nameLower": "maximilian wagner",
    "abholadresse": {
      "strasse": "Dorfstraße 32, Wels",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Lindenweg 99, Salzburg",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "1",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_96",
    "kundenNummer": "HUBI1096",
    "name": "Katharina Pichler",
    "email": "katharina.pichler@example.com",
    "phone": "+43 501515444",
    "createdAt": "2026-04-28T14:59:54.277Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina96",
    "address": {
      "street": "Waldstraße 70",
      "city": "Wien",
      "zip": "9939",
      "country": "Österreich"
    },
    "nameLower": "katharina pichler",
    "abholadresse": {
      "strasse": "Waldstraße 70, Wien",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 73, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "14",
      "mittlereUmzugskartons": "1",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_97",
    "kundenNummer": "HUBI1097",
    "name": "Lukas Müller",
    "email": "lukas.müller@example.com",
    "phone": "+43 203761334",
    "createdAt": "2026-05-03T05:10:03.643Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas97",
    "address": {
      "street": "Bahnhofstraße 82",
      "city": "Wels",
      "zip": "5359",
      "country": "Österreich"
    },
    "nameLower": "lukas müller",
    "abholadresse": {
      "strasse": "Bahnhofstraße 82, Wels",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Feldgasse 15, Linz",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_98",
    "kundenNummer": "HUBI1098",
    "name": "Thomas Mayer",
    "email": "thomas.mayer@example.com",
    "phone": "+43 117405441",
    "createdAt": "2025-08-26T15:12:58.704Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas98",
    "address": {
      "street": "Waldstraße 17",
      "city": "Linz",
      "zip": "9944",
      "country": "Österreich"
    },
    "nameLower": "thomas mayer",
    "abholadresse": {
      "strasse": "Waldstraße 17, Linz",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 7, Salzburg",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "9",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_99",
    "kundenNummer": "HUBI1099",
    "name": "Christina Gruber",
    "email": "christina.gruber@example.com",
    "phone": "+43 187606818",
    "createdAt": "2026-04-11T21:20:59.225Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina99",
    "address": {
      "street": "Feldgasse 69",
      "city": "Graz",
      "zip": "8451",
      "country": "Österreich"
    },
    "nameLower": "christina gruber",
    "abholadresse": {
      "strasse": "Feldgasse 69, Graz",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 77, Villach",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "5",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_100",
    "kundenNummer": "HUBI1100",
    "name": "Alexander Müller",
    "email": "alexander.müller@example.com",
    "phone": "+43 677291103",
    "createdAt": "2026-06-12T21:09:04.658Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander100",
    "address": {
      "street": "Dorfstraße 55",
      "city": "Klagenfurt",
      "zip": "9046",
      "country": "Österreich"
    },
    "nameLower": "alexander müller",
    "abholadresse": {
      "strasse": "Dorfstraße 55, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 80, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_101",
    "kundenNummer": "HUBI1101",
    "name": "Andreas Bauer",
    "email": "andreas.bauer@example.com",
    "phone": "+43 154121116",
    "createdAt": "2026-05-20T23:34:18.440Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas101",
    "address": {
      "street": "Gartenstraße 90",
      "city": "Linz",
      "zip": "3529",
      "country": "Österreich"
    },
    "nameLower": "andreas bauer",
    "abholadresse": {
      "strasse": "Gartenstraße 90, Linz",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 14, Wien",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_102",
    "kundenNummer": "HUBI1102",
    "name": "Alexander Reiter",
    "email": "alexander.reiter@example.com",
    "phone": "+43 675585621",
    "createdAt": "2025-10-18T00:04:58.504Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander102",
    "address": {
      "street": "Hauptstraße 83",
      "city": "St. Pölten",
      "zip": "7007",
      "country": "Österreich"
    },
    "nameLower": "alexander reiter",
    "abholadresse": {
      "strasse": "Hauptstraße 83, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Feldgasse 89, Salzburg",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "4",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_103",
    "kundenNummer": "HUBI1103",
    "name": "David Mayer",
    "email": "david.mayer@example.com",
    "phone": "+43 974560260",
    "createdAt": "2025-09-08T06:36:23.237Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David103",
    "address": {
      "street": "Rathausplatz 26",
      "city": "Wien",
      "zip": "3826",
      "country": "Österreich"
    },
    "nameLower": "david mayer",
    "abholadresse": {
      "strasse": "Rathausplatz 26, Wien",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Schulstraße 79, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "23",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_104",
    "kundenNummer": "HUBI1104",
    "name": "Michael Steiner",
    "email": "michael.steiner@example.com",
    "phone": "+43 367054275",
    "createdAt": "2025-07-09T09:49:08.268Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael104",
    "address": {
      "street": "Waldstraße 56",
      "city": "Dornbirn",
      "zip": "5935",
      "country": "Österreich"
    },
    "nameLower": "michael steiner",
    "abholadresse": {
      "strasse": "Waldstraße 56, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Lindenweg 70, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_105",
    "kundenNummer": "HUBI1105",
    "name": "Laura Fischer",
    "email": "laura.fischer@example.com",
    "phone": "+43 472153400",
    "createdAt": "2025-09-22T03:05:47.495Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura105",
    "address": {
      "street": "Waldstraße 12",
      "city": "Innsbruck",
      "zip": "5009",
      "country": "Österreich"
    },
    "nameLower": "laura fischer",
    "abholadresse": {
      "strasse": "Waldstraße 12, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 34, Linz",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "10",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_106",
    "kundenNummer": "HUBI1106",
    "name": "Julia Hofer",
    "email": "julia.hofer@example.com",
    "phone": "+43 991673312",
    "createdAt": "2026-03-25T19:16:29.915Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia106",
    "address": {
      "street": "Lindenweg 2",
      "city": "Dornbirn",
      "zip": "8981",
      "country": "Österreich"
    },
    "nameLower": "julia hofer",
    "abholadresse": {
      "strasse": "Lindenweg 2, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Lindenweg 93, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_107",
    "kundenNummer": "HUBI1107",
    "name": "David Pichler",
    "email": "david.pichler@example.com",
    "phone": "+43 283203342",
    "createdAt": "2025-02-03T02:44:25.669Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David107",
    "address": {
      "street": "Dorfstraße 12",
      "city": "Innsbruck",
      "zip": "1495",
      "country": "Österreich"
    },
    "nameLower": "david pichler",
    "abholadresse": {
      "strasse": "Dorfstraße 12, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Schulstraße 55, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_108",
    "kundenNummer": "HUBI1108",
    "name": "Alexander Fuchs",
    "email": "alexander.fuchs@example.com",
    "phone": "+43 171077672",
    "createdAt": "2025-08-09T15:05:10.396Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander108",
    "address": {
      "street": "Dorfstraße 38",
      "city": "Wien",
      "zip": "9593",
      "country": "Österreich"
    },
    "nameLower": "alexander fuchs",
    "abholadresse": {
      "strasse": "Dorfstraße 38, Wien",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bergstraße 22, Graz",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "27",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_109",
    "kundenNummer": "HUBI1109",
    "name": "Anna Pichler",
    "email": "anna.pichler@example.com",
    "phone": "+43 983144153",
    "createdAt": "2025-01-16T09:57:50.065Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna109",
    "address": {
      "street": "Lindenweg 39",
      "city": "Graz",
      "zip": "4455",
      "country": "Österreich"
    },
    "nameLower": "anna pichler",
    "abholadresse": {
      "strasse": "Lindenweg 39, Graz",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Waldstraße 48, Salzburg",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "20",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_110",
    "kundenNummer": "HUBI1110",
    "name": "Sophie Koch",
    "email": "sophie.koch@example.com",
    "phone": "+43 208492492",
    "createdAt": "2026-04-19T19:45:59.281Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie110",
    "address": {
      "street": "Bahnhofstraße 60",
      "city": "St. Pölten",
      "zip": "9117",
      "country": "Österreich"
    },
    "nameLower": "sophie koch",
    "abholadresse": {
      "strasse": "Bahnhofstraße 60, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Schulstraße 11, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "0",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_111",
    "kundenNummer": "HUBI1111",
    "name": "Maria Pichler",
    "email": "maria.pichler@example.com",
    "phone": "+43 721968855",
    "createdAt": "2026-03-04T17:23:06.634Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria111",
    "address": {
      "street": "Wiesenweg 2",
      "city": "Villach",
      "zip": "4396",
      "country": "Österreich"
    },
    "nameLower": "maria pichler",
    "abholadresse": {
      "strasse": "Wiesenweg 2, Villach",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 25, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "0",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_112",
    "kundenNummer": "HUBI1112",
    "name": "Martin Koch",
    "email": "martin.koch@example.com",
    "phone": "+43 908810459",
    "createdAt": "2025-08-04T16:52:51.445Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin112",
    "address": {
      "street": "Feldgasse 49",
      "city": "Innsbruck",
      "zip": "6576",
      "country": "Österreich"
    },
    "nameLower": "martin koch",
    "abholadresse": {
      "strasse": "Feldgasse 49, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 88, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "28",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_113",
    "kundenNummer": "HUBI1113",
    "name": "Martin Hofer",
    "email": "martin.hofer@example.com",
    "phone": "+43 600132129",
    "createdAt": "2026-03-25T06:24:52.574Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin113",
    "address": {
      "street": "Lindenweg 24",
      "city": "St. Pölten",
      "zip": "7346",
      "country": "Österreich"
    },
    "nameLower": "martin hofer",
    "abholadresse": {
      "strasse": "Lindenweg 24, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Feldgasse 36, Salzburg",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "9",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_114",
    "kundenNummer": "HUBI1114",
    "name": "Katharina Huber",
    "email": "katharina.huber@example.com",
    "phone": "+43 405563016",
    "createdAt": "2026-06-30T04:53:30.728Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina114",
    "address": {
      "street": "Gartenstraße 1",
      "city": "Graz",
      "zip": "6381",
      "country": "Österreich"
    },
    "nameLower": "katharina huber",
    "abholadresse": {
      "strasse": "Gartenstraße 1, Graz",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 50, Wien",
      "stockwerk": "1",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_115",
    "kundenNummer": "HUBI1115",
    "name": "Thomas Schmid",
    "email": "thomas.schmid@example.com",
    "phone": "+43 324051925",
    "createdAt": "2025-07-12T13:25:47.605Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas115",
    "address": {
      "street": "Waldstraße 46",
      "city": "Wien",
      "zip": "1674",
      "country": "Österreich"
    },
    "nameLower": "thomas schmid",
    "abholadresse": {
      "strasse": "Waldstraße 46, Wien",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Feldgasse 98, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "14",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_116",
    "kundenNummer": "HUBI1116",
    "name": "Alexander Wagner",
    "email": "alexander.wagner@example.com",
    "phone": "+43 843651449",
    "createdAt": "2026-03-05T04:28:32.175Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander116",
    "address": {
      "street": "Bergstraße 34",
      "city": "Salzburg",
      "zip": "5958",
      "country": "Österreich"
    },
    "nameLower": "alexander wagner",
    "abholadresse": {
      "strasse": "Bergstraße 34, Salzburg",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Schulstraße 46, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "4",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_117",
    "kundenNummer": "HUBI1117",
    "name": "Andreas Moser",
    "email": "andreas.moser@example.com",
    "phone": "+43 624731917",
    "createdAt": "2025-05-22T11:18:59.921Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas117",
    "address": {
      "street": "Schulstraße 39",
      "city": "Graz",
      "zip": "1708",
      "country": "Österreich"
    },
    "nameLower": "andreas moser",
    "abholadresse": {
      "strasse": "Schulstraße 39, Graz",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 8, Salzburg",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_118",
    "kundenNummer": "HUBI1118",
    "name": "Christian Wagner",
    "email": "christian.wagner@example.com",
    "phone": "+43 122876648",
    "createdAt": "2025-07-08T05:37:47.863Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian118",
    "address": {
      "street": "Bahnhofstraße 10",
      "city": "Linz",
      "zip": "2002",
      "country": "Österreich"
    },
    "nameLower": "christian wagner",
    "abholadresse": {
      "strasse": "Bahnhofstraße 10, Linz",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bergstraße 2, Graz",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "2",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_119",
    "kundenNummer": "HUBI1119",
    "name": "Sarah Huber",
    "email": "sarah.huber@example.com",
    "phone": "+43 531449446",
    "createdAt": "2026-05-17T21:31:30.954Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah119",
    "address": {
      "street": "Gartenstraße 13",
      "city": "Dornbirn",
      "zip": "7592",
      "country": "Österreich"
    },
    "nameLower": "sarah huber",
    "abholadresse": {
      "strasse": "Gartenstraße 13, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bergstraße 94, Linz",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_120",
    "kundenNummer": "HUBI1120",
    "name": "Elena Schmidt",
    "email": "elena.schmidt@example.com",
    "phone": "+43 752508137",
    "createdAt": "2025-09-07T00:42:04.780Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena120",
    "address": {
      "street": "Bahnhofstraße 99",
      "city": "Salzburg",
      "zip": "7325",
      "country": "Österreich"
    },
    "nameLower": "elena schmidt",
    "abholadresse": {
      "strasse": "Bahnhofstraße 99, Salzburg",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 44, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "19",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_121",
    "kundenNummer": "HUBI1121",
    "name": "Laura Pichler",
    "email": "laura.pichler@example.com",
    "phone": "+43 105977872",
    "createdAt": "2025-08-17T15:42:32.491Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura121",
    "address": {
      "street": "Feldgasse 92",
      "city": "Klagenfurt",
      "zip": "4987",
      "country": "Österreich"
    },
    "nameLower": "laura pichler",
    "abholadresse": {
      "strasse": "Feldgasse 92, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Schulstraße 51, Wien",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "12",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_122",
    "kundenNummer": "HUBI1122",
    "name": "Laura Wagner",
    "email": "laura.wagner@example.com",
    "phone": "+43 715451920",
    "createdAt": "2025-12-25T02:17:21.527Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura122",
    "address": {
      "street": "Gartenstraße 71",
      "city": "Salzburg",
      "zip": "7290",
      "country": "Österreich"
    },
    "nameLower": "laura wagner",
    "abholadresse": {
      "strasse": "Gartenstraße 71, Salzburg",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Feldgasse 50, Salzburg",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "2",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_123",
    "kundenNummer": "HUBI1123",
    "name": "Alexander Wagner",
    "email": "alexander.wagner@example.com",
    "phone": "+43 138486717",
    "createdAt": "2026-01-16T03:09:59.537Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander123",
    "address": {
      "street": "Hauptstraße 91",
      "city": "Klagenfurt",
      "zip": "3347",
      "country": "Österreich"
    },
    "nameLower": "alexander wagner",
    "abholadresse": {
      "strasse": "Hauptstraße 91, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 91, Salzburg",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "7",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_124",
    "kundenNummer": "HUBI1124",
    "name": "Thomas Reiter",
    "email": "thomas.reiter@example.com",
    "phone": "+43 535576742",
    "createdAt": "2026-03-08T00:28:41.094Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas124",
    "address": {
      "street": "Dorfstraße 85",
      "city": "Linz",
      "zip": "8786",
      "country": "Österreich"
    },
    "nameLower": "thomas reiter",
    "abholadresse": {
      "strasse": "Dorfstraße 85, Linz",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bergstraße 80, Linz",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "8",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_125",
    "kundenNummer": "HUBI1125",
    "name": "Thomas Pichler",
    "email": "thomas.pichler@example.com",
    "phone": "+43 301869471",
    "createdAt": "2025-10-09T23:25:12.907Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas125",
    "address": {
      "street": "Dorfstraße 94",
      "city": "Dornbirn",
      "zip": "5940",
      "country": "Österreich"
    },
    "nameLower": "thomas pichler",
    "abholadresse": {
      "strasse": "Dorfstraße 94, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 50, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "27",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_126",
    "kundenNummer": "HUBI1126",
    "name": "Laura Fuchs",
    "email": "laura.fuchs@example.com",
    "phone": "+43 742889466",
    "createdAt": "2025-11-06T23:25:25.742Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura126",
    "address": {
      "street": "Bahnhofstraße 47",
      "city": "Klagenfurt",
      "zip": "3625",
      "country": "Österreich"
    },
    "nameLower": "laura fuchs",
    "abholadresse": {
      "strasse": "Bahnhofstraße 47, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 49, Salzburg",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "4",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_127",
    "kundenNummer": "HUBI1127",
    "name": "Christian Steiner",
    "email": "christian.steiner@example.com",
    "phone": "+43 115691093",
    "createdAt": "2025-09-30T00:45:48.717Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian127",
    "address": {
      "street": "Bahnhofstraße 32",
      "city": "Dornbirn",
      "zip": "3794",
      "country": "Österreich"
    },
    "nameLower": "christian steiner",
    "abholadresse": {
      "strasse": "Bahnhofstraße 32, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 52, Villach",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_128",
    "kundenNummer": "HUBI1128",
    "name": "David Fuchs",
    "email": "david.fuchs@example.com",
    "phone": "+43 510328858",
    "createdAt": "2025-11-05T00:28:49.227Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David128",
    "address": {
      "street": "Waldstraße 46",
      "city": "Linz",
      "zip": "2907",
      "country": "Österreich"
    },
    "nameLower": "david fuchs",
    "abholadresse": {
      "strasse": "Waldstraße 46, Linz",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 53, Villach",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_129",
    "kundenNummer": "HUBI1129",
    "name": "Katharina Schmidt",
    "email": "katharina.schmidt@example.com",
    "phone": "+43 697191293",
    "createdAt": "2025-06-18T03:00:46.705Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina129",
    "address": {
      "street": "Lindenweg 33",
      "city": "Linz",
      "zip": "7658",
      "country": "Österreich"
    },
    "nameLower": "katharina schmidt",
    "abholadresse": {
      "strasse": "Lindenweg 33, Linz",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Lindenweg 33, Linz",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "8",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_130",
    "kundenNummer": "HUBI1130",
    "name": "David Huber",
    "email": "david.huber@example.com",
    "phone": "+43 282971977",
    "createdAt": "2026-05-08T16:22:38.410Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David130",
    "address": {
      "street": "Bergstraße 65",
      "city": "Dornbirn",
      "zip": "8843",
      "country": "Österreich"
    },
    "nameLower": "david huber",
    "abholadresse": {
      "strasse": "Bergstraße 65, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 37, Salzburg",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_131",
    "kundenNummer": "HUBI1131",
    "name": "Christian Winkler",
    "email": "christian.winkler@example.com",
    "phone": "+43 578494761",
    "createdAt": "2026-02-10T05:33:19.638Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian131",
    "address": {
      "street": "Lindenweg 49",
      "city": "Villach",
      "zip": "9426",
      "country": "Österreich"
    },
    "nameLower": "christian winkler",
    "abholadresse": {
      "strasse": "Lindenweg 49, Villach",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Lindenweg 29, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "8",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_132",
    "kundenNummer": "HUBI1132",
    "name": "Maximilian Berger",
    "email": "maximilian.berger@example.com",
    "phone": "+43 696092729",
    "createdAt": "2025-05-02T07:47:39.485Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian132",
    "address": {
      "street": "Feldgasse 73",
      "city": "Dornbirn",
      "zip": "7745",
      "country": "Österreich"
    },
    "nameLower": "maximilian berger",
    "abholadresse": {
      "strasse": "Feldgasse 73, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 30, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "12",
      "mittlereUmzugskartons": "22",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_133",
    "kundenNummer": "HUBI1133",
    "name": "Sarah Berger",
    "email": "sarah.berger@example.com",
    "phone": "+43 394144123",
    "createdAt": "2025-02-27T13:10:58.497Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah133",
    "address": {
      "street": "Rathausplatz 73",
      "city": "Linz",
      "zip": "8835",
      "country": "Österreich"
    },
    "nameLower": "sarah berger",
    "abholadresse": {
      "strasse": "Rathausplatz 73, Linz",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 35, Villach",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "11",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_134",
    "kundenNummer": "HUBI1134",
    "name": "Martin Huber",
    "email": "martin.huber@example.com",
    "phone": "+43 944663312",
    "createdAt": "2025-12-15T21:57:53.200Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin134",
    "address": {
      "street": "Schulstraße 92",
      "city": "Salzburg",
      "zip": "8141",
      "country": "Österreich"
    },
    "nameLower": "martin huber",
    "abholadresse": {
      "strasse": "Schulstraße 92, Salzburg",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Lindenweg 99, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "2",
      "mittlereUmzugskartons": "1",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_135",
    "kundenNummer": "HUBI1135",
    "name": "Alexander Berger",
    "email": "alexander.berger@example.com",
    "phone": "+43 730494359",
    "createdAt": "2026-03-18T09:43:50.818Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander135",
    "address": {
      "street": "Hauptstraße 15",
      "city": "St. Pölten",
      "zip": "6697",
      "country": "Österreich"
    },
    "nameLower": "alexander berger",
    "abholadresse": {
      "strasse": "Hauptstraße 15, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Lindenweg 35, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "18",
      "mittlereUmzugskartons": "13",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_136",
    "kundenNummer": "HUBI1136",
    "name": "Maximilian Berger",
    "email": "maximilian.berger@example.com",
    "phone": "+43 262555639",
    "createdAt": "2026-06-02T00:50:06.930Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian136",
    "address": {
      "street": "Dorfstraße 62",
      "city": "Wels",
      "zip": "4279",
      "country": "Österreich"
    },
    "nameLower": "maximilian berger",
    "abholadresse": {
      "strasse": "Dorfstraße 62, Wels",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Schulstraße 20, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "12",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_137",
    "kundenNummer": "HUBI1137",
    "name": "Christian Mayer",
    "email": "christian.mayer@example.com",
    "phone": "+43 164264798",
    "createdAt": "2025-10-30T05:43:45.235Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian137",
    "address": {
      "street": "Feldgasse 61",
      "city": "Villach",
      "zip": "6815",
      "country": "Österreich"
    },
    "nameLower": "christian mayer",
    "abholadresse": {
      "strasse": "Feldgasse 61, Villach",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Lindenweg 93, Salzburg",
      "stockwerk": "3",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_138",
    "kundenNummer": "HUBI1138",
    "name": "Andreas Pichler",
    "email": "andreas.pichler@example.com",
    "phone": "+43 922491532",
    "createdAt": "2026-01-05T16:46:50.320Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas138",
    "address": {
      "street": "Schulstraße 93",
      "city": "Dornbirn",
      "zip": "2066",
      "country": "Österreich"
    },
    "nameLower": "andreas pichler",
    "abholadresse": {
      "strasse": "Schulstraße 93, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bergstraße 59, Villach",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_139",
    "kundenNummer": "HUBI1139",
    "name": "Laura Berger",
    "email": "laura.berger@example.com",
    "phone": "+43 590833780",
    "createdAt": "2025-08-16T22:40:30.062Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura139",
    "address": {
      "street": "Lindenweg 39",
      "city": "Wien",
      "zip": "9834",
      "country": "Österreich"
    },
    "nameLower": "laura berger",
    "abholadresse": {
      "strasse": "Lindenweg 39, Wien",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 61, Salzburg",
      "stockwerk": "2",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_140",
    "kundenNummer": "HUBI1140",
    "name": "Andreas Mayer",
    "email": "andreas.mayer@example.com",
    "phone": "+43 197746602",
    "createdAt": "2026-05-09T09:50:45.538Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas140",
    "address": {
      "street": "Gartenstraße 40",
      "city": "Wels",
      "zip": "2612",
      "country": "Österreich"
    },
    "nameLower": "andreas mayer",
    "abholadresse": {
      "strasse": "Gartenstraße 40, Wels",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Lindenweg 99, Villach",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "1",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_141",
    "kundenNummer": "HUBI1141",
    "name": "Andreas Müller",
    "email": "andreas.müller@example.com",
    "phone": "+43 556613499",
    "createdAt": "2026-04-20T17:31:53.379Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas141",
    "address": {
      "street": "Feldgasse 9",
      "city": "Klagenfurt",
      "zip": "4560",
      "country": "Österreich"
    },
    "nameLower": "andreas müller",
    "abholadresse": {
      "strasse": "Feldgasse 9, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 76, Villach",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "7",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_142",
    "kundenNummer": "HUBI1142",
    "name": "Elena Berger",
    "email": "elena.berger@example.com",
    "phone": "+43 113795067",
    "createdAt": "2025-04-13T06:58:46.282Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena142",
    "address": {
      "street": "Feldgasse 65",
      "city": "Linz",
      "zip": "5157",
      "country": "Österreich"
    },
    "nameLower": "elena berger",
    "abholadresse": {
      "strasse": "Feldgasse 65, Linz",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 16, Salzburg",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "12",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_143",
    "kundenNummer": "HUBI1143",
    "name": "Katharina Huber",
    "email": "katharina.huber@example.com",
    "phone": "+43 822586864",
    "createdAt": "2025-09-27T05:53:55.616Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina143",
    "address": {
      "street": "Lindenweg 61",
      "city": "Klagenfurt",
      "zip": "3229",
      "country": "Österreich"
    },
    "nameLower": "katharina huber",
    "abholadresse": {
      "strasse": "Lindenweg 61, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 67, Wels",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "20",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_144",
    "kundenNummer": "HUBI1144",
    "name": "Katharina Wagner",
    "email": "katharina.wagner@example.com",
    "phone": "+43 390325484",
    "createdAt": "2025-09-25T02:46:51.180Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina144",
    "address": {
      "street": "Hauptstraße 6",
      "city": "Klagenfurt",
      "zip": "6165",
      "country": "Österreich"
    },
    "nameLower": "katharina wagner",
    "abholadresse": {
      "strasse": "Hauptstraße 6, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 48, Wien",
      "stockwerk": "3",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_145",
    "kundenNummer": "HUBI1145",
    "name": "Sarah Eder",
    "email": "sarah.eder@example.com",
    "phone": "+43 968185118",
    "createdAt": "2025-06-03T08:09:49.724Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah145",
    "address": {
      "street": "Gartenstraße 71",
      "city": "Graz",
      "zip": "5521",
      "country": "Österreich"
    },
    "nameLower": "sarah eder",
    "abholadresse": {
      "strasse": "Gartenstraße 71, Graz",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 93, Wels",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "10",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_146",
    "kundenNummer": "HUBI1146",
    "name": "Christina Fuchs",
    "email": "christina.fuchs@example.com",
    "phone": "+43 135232187",
    "createdAt": "2026-05-11T14:40:57.686Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina146",
    "address": {
      "street": "Bahnhofstraße 10",
      "city": "Linz",
      "zip": "5077",
      "country": "Österreich"
    },
    "nameLower": "christina fuchs",
    "abholadresse": {
      "strasse": "Bahnhofstraße 10, Linz",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 90, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "10",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_147",
    "kundenNummer": "HUBI1147",
    "name": "Andreas Bauer",
    "email": "andreas.bauer@example.com",
    "phone": "+43 711173798",
    "createdAt": "2026-01-14T19:39:53.676Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas147",
    "address": {
      "street": "Feldgasse 11",
      "city": "Wels",
      "zip": "9349",
      "country": "Österreich"
    },
    "nameLower": "andreas bauer",
    "abholadresse": {
      "strasse": "Feldgasse 11, Wels",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Waldstraße 66, Wien",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_148",
    "kundenNummer": "HUBI1148",
    "name": "David Hofer",
    "email": "david.hofer@example.com",
    "phone": "+43 597202193",
    "createdAt": "2025-03-11T04:21:34.053Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David148",
    "address": {
      "street": "Dorfstraße 36",
      "city": "Innsbruck",
      "zip": "9594",
      "country": "Österreich"
    },
    "nameLower": "david hofer",
    "abholadresse": {
      "strasse": "Dorfstraße 36, Innsbruck",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 65, Salzburg",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "14",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_149",
    "kundenNummer": "HUBI1149",
    "name": "David Fischer",
    "email": "david.fischer@example.com",
    "phone": "+43 653201179",
    "createdAt": "2026-04-02T03:29:03.343Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David149",
    "address": {
      "street": "Bahnhofstraße 27",
      "city": "Salzburg",
      "zip": "8585",
      "country": "Österreich"
    },
    "nameLower": "david fischer",
    "abholadresse": {
      "strasse": "Bahnhofstraße 27, Salzburg",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 32, Villach",
      "stockwerk": "0",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_150",
    "kundenNummer": "HUBI1150",
    "name": "Laura Schmid",
    "email": "laura.schmid@example.com",
    "phone": "+43 792640822",
    "createdAt": "2026-06-15T21:47:27.643Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura150",
    "address": {
      "street": "Bergstraße 24",
      "city": "St. Pölten",
      "zip": "6092",
      "country": "Österreich"
    },
    "nameLower": "laura schmid",
    "abholadresse": {
      "strasse": "Bergstraße 24, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 86, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_151",
    "kundenNummer": "HUBI1151",
    "name": "Christina Reiter",
    "email": "christina.reiter@example.com",
    "phone": "+43 830267259",
    "createdAt": "2025-08-15T11:55:25.259Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina151",
    "address": {
      "street": "Kirchenplatz 78",
      "city": "Wels",
      "zip": "3180",
      "country": "Österreich"
    },
    "nameLower": "christina reiter",
    "abholadresse": {
      "strasse": "Kirchenplatz 78, Wels",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 10, Linz",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "2",
      "mittlereUmzugskartons": "2",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_152",
    "kundenNummer": "HUBI1152",
    "name": "Alexander Steiner",
    "email": "alexander.steiner@example.com",
    "phone": "+43 655358562",
    "createdAt": "2025-08-04T06:41:19.075Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander152",
    "address": {
      "street": "Bahnhofstraße 42",
      "city": "Wels",
      "zip": "4904",
      "country": "Österreich"
    },
    "nameLower": "alexander steiner",
    "abholadresse": {
      "strasse": "Bahnhofstraße 42, Wels",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 72, Graz",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "20",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_153",
    "kundenNummer": "HUBI1153",
    "name": "Alexander Koch",
    "email": "alexander.koch@example.com",
    "phone": "+43 197462918",
    "createdAt": "2025-07-03T06:51:05.686Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander153",
    "address": {
      "street": "Bergstraße 41",
      "city": "Klagenfurt",
      "zip": "6463",
      "country": "Österreich"
    },
    "nameLower": "alexander koch",
    "abholadresse": {
      "strasse": "Bergstraße 41, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 78, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_154",
    "kundenNummer": "HUBI1154",
    "name": "Michael Fuchs",
    "email": "michael.fuchs@example.com",
    "phone": "+43 631497814",
    "createdAt": "2025-09-25T12:09:35.586Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael154",
    "address": {
      "street": "Lindenweg 56",
      "city": "Klagenfurt",
      "zip": "9496",
      "country": "Österreich"
    },
    "nameLower": "michael fuchs",
    "abholadresse": {
      "strasse": "Lindenweg 56, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 85, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "23",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_155",
    "kundenNummer": "HUBI1155",
    "name": "Alexander Steiner",
    "email": "alexander.steiner@example.com",
    "phone": "+43 519695725",
    "createdAt": "2025-04-13T05:45:09.117Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander155",
    "address": {
      "street": "Rathausplatz 17",
      "city": "Wels",
      "zip": "8829",
      "country": "Österreich"
    },
    "nameLower": "alexander steiner",
    "abholadresse": {
      "strasse": "Rathausplatz 17, Wels",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 68, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "3",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_156",
    "kundenNummer": "HUBI1156",
    "name": "Andreas Gruber",
    "email": "andreas.gruber@example.com",
    "phone": "+43 447672614",
    "createdAt": "2026-01-05T18:07:53.993Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas156",
    "address": {
      "street": "Gartenstraße 2",
      "city": "Salzburg",
      "zip": "4191",
      "country": "Österreich"
    },
    "nameLower": "andreas gruber",
    "abholadresse": {
      "strasse": "Gartenstraße 2, Salzburg",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 87, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_157",
    "kundenNummer": "HUBI1157",
    "name": "Katharina Bauer",
    "email": "katharina.bauer@example.com",
    "phone": "+43 503923278",
    "createdAt": "2025-04-20T03:27:40.961Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina157",
    "address": {
      "street": "Dorfstraße 74",
      "city": "Graz",
      "zip": "3612",
      "country": "Österreich"
    },
    "nameLower": "katharina bauer",
    "abholadresse": {
      "strasse": "Dorfstraße 74, Graz",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Schulstraße 87, Linz",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "7",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_158",
    "kundenNummer": "HUBI1158",
    "name": "Maximilian Reiter",
    "email": "maximilian.reiter@example.com",
    "phone": "+43 969144359",
    "createdAt": "2026-07-18T21:24:32.104Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian158",
    "address": {
      "street": "Gartenstraße 16",
      "city": "Wien",
      "zip": "7723",
      "country": "Österreich"
    },
    "nameLower": "maximilian reiter",
    "abholadresse": {
      "strasse": "Gartenstraße 16, Wien",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 53, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "14",
      "mittlereUmzugskartons": "13",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_159",
    "kundenNummer": "HUBI1159",
    "name": "Christina Müller",
    "email": "christina.müller@example.com",
    "phone": "+43 818000422",
    "createdAt": "2025-07-13T22:32:49.814Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina159",
    "address": {
      "street": "Bergstraße 0",
      "city": "St. Pölten",
      "zip": "1262",
      "country": "Österreich"
    },
    "nameLower": "christina müller",
    "abholadresse": {
      "strasse": "Bergstraße 0, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 16, Wels",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_160",
    "kundenNummer": "HUBI1160",
    "name": "Martin Hofer",
    "email": "martin.hofer@example.com",
    "phone": "+43 549271500",
    "createdAt": "2025-08-30T16:04:40.447Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin160",
    "address": {
      "street": "Waldstraße 48",
      "city": "Graz",
      "zip": "9473",
      "country": "Österreich"
    },
    "nameLower": "martin hofer",
    "abholadresse": {
      "strasse": "Waldstraße 48, Graz",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 71, Graz",
      "stockwerk": "0",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_161",
    "kundenNummer": "HUBI1161",
    "name": "Maria Pichler",
    "email": "maria.pichler@example.com",
    "phone": "+43 465267599",
    "createdAt": "2025-11-18T09:32:13.738Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria161",
    "address": {
      "street": "Kirchenplatz 19",
      "city": "Dornbirn",
      "zip": "4541",
      "country": "Österreich"
    },
    "nameLower": "maria pichler",
    "abholadresse": {
      "strasse": "Kirchenplatz 19, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Lindenweg 9, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "19",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_162",
    "kundenNummer": "HUBI1162",
    "name": "Martin Hofer",
    "email": "martin.hofer@example.com",
    "phone": "+43 353225655",
    "createdAt": "2026-03-29T22:36:08.516Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin162",
    "address": {
      "street": "Lindenweg 16",
      "city": "Wien",
      "zip": "6783",
      "country": "Österreich"
    },
    "nameLower": "martin hofer",
    "abholadresse": {
      "strasse": "Lindenweg 16, Wien",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Lindenweg 85, Graz",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_163",
    "kundenNummer": "HUBI1163",
    "name": "Maria Koch",
    "email": "maria.koch@example.com",
    "phone": "+43 658366617",
    "createdAt": "2025-06-18T04:29:41.744Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria163",
    "address": {
      "street": "Wiesenweg 47",
      "city": "Graz",
      "zip": "6869",
      "country": "Österreich"
    },
    "nameLower": "maria koch",
    "abholadresse": {
      "strasse": "Wiesenweg 47, Graz",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 90, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "5",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_164",
    "kundenNummer": "HUBI1164",
    "name": "Thomas Eder",
    "email": "thomas.eder@example.com",
    "phone": "+43 749343043",
    "createdAt": "2025-07-24T17:36:00.771Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas164",
    "address": {
      "street": "Dorfstraße 95",
      "city": "Graz",
      "zip": "4003",
      "country": "Österreich"
    },
    "nameLower": "thomas eder",
    "abholadresse": {
      "strasse": "Dorfstraße 95, Graz",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bergstraße 65, Linz",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "15",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_165",
    "kundenNummer": "HUBI1165",
    "name": "Maria Eder",
    "email": "maria.eder@example.com",
    "phone": "+43 762538468",
    "createdAt": "2025-02-15T08:05:01.906Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria165",
    "address": {
      "street": "Schulstraße 68",
      "city": "St. Pölten",
      "zip": "2386",
      "country": "Österreich"
    },
    "nameLower": "maria eder",
    "abholadresse": {
      "strasse": "Schulstraße 68, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 29, Villach",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "14",
      "mittlereUmzugskartons": "15",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_166",
    "kundenNummer": "HUBI1166",
    "name": "Martin Moser",
    "email": "martin.moser@example.com",
    "phone": "+43 352635769",
    "createdAt": "2025-06-09T04:43:44.443Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin166",
    "address": {
      "street": "Waldstraße 24",
      "city": "Innsbruck",
      "zip": "1675",
      "country": "Österreich"
    },
    "nameLower": "martin moser",
    "abholadresse": {
      "strasse": "Waldstraße 24, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Schulstraße 1, Villach",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "25",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_167",
    "kundenNummer": "HUBI1167",
    "name": "Thomas Fuchs",
    "email": "thomas.fuchs@example.com",
    "phone": "+43 473446303",
    "createdAt": "2025-06-26T08:35:17.319Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas167",
    "address": {
      "street": "Bergstraße 11",
      "city": "Villach",
      "zip": "5990",
      "country": "Österreich"
    },
    "nameLower": "thomas fuchs",
    "abholadresse": {
      "strasse": "Bergstraße 11, Villach",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 80, Wien",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "13",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_168",
    "kundenNummer": "HUBI1168",
    "name": "Julia Bauer",
    "email": "julia.bauer@example.com",
    "phone": "+43 674493607",
    "createdAt": "2026-03-03T03:33:55.498Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia168",
    "address": {
      "street": "Schulstraße 90",
      "city": "Salzburg",
      "zip": "3554",
      "country": "Österreich"
    },
    "nameLower": "julia bauer",
    "abholadresse": {
      "strasse": "Schulstraße 90, Salzburg",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 19, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_169",
    "kundenNummer": "HUBI1169",
    "name": "Maria Gruber",
    "email": "maria.gruber@example.com",
    "phone": "+43 162788173",
    "createdAt": "2025-07-10T23:55:32.148Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria169",
    "address": {
      "street": "Feldgasse 18",
      "city": "Villach",
      "zip": "8821",
      "country": "Österreich"
    },
    "nameLower": "maria gruber",
    "abholadresse": {
      "strasse": "Feldgasse 18, Villach",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 75, Wien",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "14",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_170",
    "kundenNummer": "HUBI1170",
    "name": "Alexander Bauer",
    "email": "alexander.bauer@example.com",
    "phone": "+43 428601988",
    "createdAt": "2025-01-02T21:07:31.275Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander170",
    "address": {
      "street": "Schulstraße 63",
      "city": "Klagenfurt",
      "zip": "7933",
      "country": "Österreich"
    },
    "nameLower": "alexander bauer",
    "abholadresse": {
      "strasse": "Schulstraße 63, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 96, Wien",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "13",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_171",
    "kundenNummer": "HUBI1171",
    "name": "Sarah Pichler",
    "email": "sarah.pichler@example.com",
    "phone": "+43 253565288",
    "createdAt": "2026-01-03T08:29:55.821Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah171",
    "address": {
      "street": "Gartenstraße 48",
      "city": "Innsbruck",
      "zip": "4110",
      "country": "Österreich"
    },
    "nameLower": "sarah pichler",
    "abholadresse": {
      "strasse": "Gartenstraße 48, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 88, Graz",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "7",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_172",
    "kundenNummer": "HUBI1172",
    "name": "Lisa Bauer",
    "email": "lisa.bauer@example.com",
    "phone": "+43 199201298",
    "createdAt": "2025-05-05T19:10:53.188Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa172",
    "address": {
      "street": "Wiesenweg 44",
      "city": "Wels",
      "zip": "1000",
      "country": "Österreich"
    },
    "nameLower": "lisa bauer",
    "abholadresse": {
      "strasse": "Wiesenweg 44, Wels",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 39, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_173",
    "kundenNummer": "HUBI1173",
    "name": "Sarah Schmidt",
    "email": "sarah.schmidt@example.com",
    "phone": "+43 832238337",
    "createdAt": "2026-05-14T13:07:24.646Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah173",
    "address": {
      "street": "Kirchenplatz 58",
      "city": "Graz",
      "zip": "4515",
      "country": "Österreich"
    },
    "nameLower": "sarah schmidt",
    "abholadresse": {
      "strasse": "Kirchenplatz 58, Graz",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bergstraße 89, Linz",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "14",
      "mittlereUmzugskartons": "3",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_174",
    "kundenNummer": "HUBI1174",
    "name": "Stefan Winkler",
    "email": "stefan.winkler@example.com",
    "phone": "+43 146815100",
    "createdAt": "2025-01-04T23:41:18.464Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan174",
    "address": {
      "street": "Schulstraße 41",
      "city": "Wels",
      "zip": "6688",
      "country": "Österreich"
    },
    "nameLower": "stefan winkler",
    "abholadresse": {
      "strasse": "Schulstraße 41, Wels",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 67, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_175",
    "kundenNummer": "HUBI1175",
    "name": "Andreas Moser",
    "email": "andreas.moser@example.com",
    "phone": "+43 456108156",
    "createdAt": "2026-07-13T09:17:48.508Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas175",
    "address": {
      "street": "Rathausplatz 18",
      "city": "St. Pölten",
      "zip": "6573",
      "country": "Österreich"
    },
    "nameLower": "andreas moser",
    "abholadresse": {
      "strasse": "Rathausplatz 18, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 85, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "29",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_176",
    "kundenNummer": "HUBI1176",
    "name": "Thomas Bauer",
    "email": "thomas.bauer@example.com",
    "phone": "+43 153039108",
    "createdAt": "2025-05-02T21:52:11.756Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas176",
    "address": {
      "street": "Feldgasse 76",
      "city": "Wels",
      "zip": "3906",
      "country": "Österreich"
    },
    "nameLower": "thomas bauer",
    "abholadresse": {
      "strasse": "Feldgasse 76, Wels",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 65, Villach",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "4",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_177",
    "kundenNummer": "HUBI1177",
    "name": "Christian Berger",
    "email": "christian.berger@example.com",
    "phone": "+43 914665525",
    "createdAt": "2026-03-09T21:38:52.493Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian177",
    "address": {
      "street": "Dorfstraße 74",
      "city": "Klagenfurt",
      "zip": "4989",
      "country": "Österreich"
    },
    "nameLower": "christian berger",
    "abholadresse": {
      "strasse": "Dorfstraße 74, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 50, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "21",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_178",
    "kundenNummer": "HUBI1178",
    "name": "Anna Wagner",
    "email": "anna.wagner@example.com",
    "phone": "+43 407366009",
    "createdAt": "2025-03-11T01:06:46.617Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna178",
    "address": {
      "street": "Schulstraße 99",
      "city": "Villach",
      "zip": "6684",
      "country": "Österreich"
    },
    "nameLower": "anna wagner",
    "abholadresse": {
      "strasse": "Schulstraße 99, Villach",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bergstraße 30, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "12",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_179",
    "kundenNummer": "HUBI1179",
    "name": "Andreas Fuchs",
    "email": "andreas.fuchs@example.com",
    "phone": "+43 402952336",
    "createdAt": "2025-11-01T22:19:25.676Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas179",
    "address": {
      "street": "Waldstraße 94",
      "city": "Dornbirn",
      "zip": "5057",
      "country": "Österreich"
    },
    "nameLower": "andreas fuchs",
    "abholadresse": {
      "strasse": "Waldstraße 94, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Waldstraße 55, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "11",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_180",
    "kundenNummer": "HUBI1180",
    "name": "Andreas Müller",
    "email": "andreas.müller@example.com",
    "phone": "+43 369582935",
    "createdAt": "2025-12-09T23:02:50.455Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas180",
    "address": {
      "street": "Schulstraße 44",
      "city": "Graz",
      "zip": "3780",
      "country": "Österreich"
    },
    "nameLower": "andreas müller",
    "abholadresse": {
      "strasse": "Schulstraße 44, Graz",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Lindenweg 93, Villach",
      "stockwerk": "0",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_181",
    "kundenNummer": "HUBI1181",
    "name": "Laura Reiter",
    "email": "laura.reiter@example.com",
    "phone": "+43 250509043",
    "createdAt": "2025-08-22T11:54:26.404Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura181",
    "address": {
      "street": "Kirchenplatz 26",
      "city": "Villach",
      "zip": "8453",
      "country": "Österreich"
    },
    "nameLower": "laura reiter",
    "abholadresse": {
      "strasse": "Kirchenplatz 26, Villach",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Feldgasse 32, Wien",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "2",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_182",
    "kundenNummer": "HUBI1182",
    "name": "Alexander Pichler",
    "email": "alexander.pichler@example.com",
    "phone": "+43 831208092",
    "createdAt": "2026-02-06T22:38:40.437Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander182",
    "address": {
      "street": "Dorfstraße 83",
      "city": "Villach",
      "zip": "1302",
      "country": "Österreich"
    },
    "nameLower": "alexander pichler",
    "abholadresse": {
      "strasse": "Dorfstraße 83, Villach",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 57, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_183",
    "kundenNummer": "HUBI1183",
    "name": "David Schmidt",
    "email": "david.schmidt@example.com",
    "phone": "+43 897405357",
    "createdAt": "2026-02-14T12:56:04.618Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David183",
    "address": {
      "street": "Gartenstraße 34",
      "city": "Innsbruck",
      "zip": "3793",
      "country": "Österreich"
    },
    "nameLower": "david schmidt",
    "abholadresse": {
      "strasse": "Gartenstraße 34, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bergstraße 71, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "12",
      "mittlereUmzugskartons": "27",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_184",
    "kundenNummer": "HUBI1184",
    "name": "Christina Hofer",
    "email": "christina.hofer@example.com",
    "phone": "+43 961388242",
    "createdAt": "2026-03-15T04:17:11.013Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina184",
    "address": {
      "street": "Dorfstraße 89",
      "city": "Klagenfurt",
      "zip": "2199",
      "country": "Österreich"
    },
    "nameLower": "christina hofer",
    "abholadresse": {
      "strasse": "Dorfstraße 89, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Schulstraße 88, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "14",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_185",
    "kundenNummer": "HUBI1185",
    "name": "Julia Reiter",
    "email": "julia.reiter@example.com",
    "phone": "+43 805894118",
    "createdAt": "2026-06-29T09:28:23.012Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia185",
    "address": {
      "street": "Kirchenplatz 64",
      "city": "Villach",
      "zip": "7401",
      "country": "Österreich"
    },
    "nameLower": "julia reiter",
    "abholadresse": {
      "strasse": "Kirchenplatz 64, Villach",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Waldstraße 40, Wels",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_186",
    "kundenNummer": "HUBI1186",
    "name": "Michael Bauer",
    "email": "michael.bauer@example.com",
    "phone": "+43 881442266",
    "createdAt": "2025-05-11T13:05:10.443Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael186",
    "address": {
      "street": "Schulstraße 48",
      "city": "Graz",
      "zip": "9548",
      "country": "Österreich"
    },
    "nameLower": "michael bauer",
    "abholadresse": {
      "strasse": "Schulstraße 48, Graz",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 21, Wels",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "14",
      "mittlereUmzugskartons": "19",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_187",
    "kundenNummer": "HUBI1187",
    "name": "Elena Mayer",
    "email": "elena.mayer@example.com",
    "phone": "+43 301190444",
    "createdAt": "2026-06-17T01:21:39.739Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena187",
    "address": {
      "street": "Schulstraße 35",
      "city": "Graz",
      "zip": "4901",
      "country": "Österreich"
    },
    "nameLower": "elena mayer",
    "abholadresse": {
      "strasse": "Schulstraße 35, Graz",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 74, Villach",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "14",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_188",
    "kundenNummer": "HUBI1188",
    "name": "Michael Mayer",
    "email": "michael.mayer@example.com",
    "phone": "+43 154896264",
    "createdAt": "2025-04-26T11:13:48.911Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael188",
    "address": {
      "street": "Kirchenplatz 76",
      "city": "Villach",
      "zip": "2033",
      "country": "Österreich"
    },
    "nameLower": "michael mayer",
    "abholadresse": {
      "strasse": "Kirchenplatz 76, Villach",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Lindenweg 99, Salzburg",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "2",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_189",
    "kundenNummer": "HUBI1189",
    "name": "Andreas Koch",
    "email": "andreas.koch@example.com",
    "phone": "+43 238765332",
    "createdAt": "2025-09-30T05:40:01.272Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas189",
    "address": {
      "street": "Bahnhofstraße 75",
      "city": "St. Pölten",
      "zip": "5427",
      "country": "Österreich"
    },
    "nameLower": "andreas koch",
    "abholadresse": {
      "strasse": "Bahnhofstraße 75, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 90, Graz",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_190",
    "kundenNummer": "HUBI1190",
    "name": "Michael Steiner",
    "email": "michael.steiner@example.com",
    "phone": "+43 946357267",
    "createdAt": "2025-10-03T20:03:36.484Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael190",
    "address": {
      "street": "Dorfstraße 83",
      "city": "Villach",
      "zip": "4500",
      "country": "Österreich"
    },
    "nameLower": "michael steiner",
    "abholadresse": {
      "strasse": "Dorfstraße 83, Villach",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bergstraße 29, Wels",
      "stockwerk": "2",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_191",
    "kundenNummer": "HUBI1191",
    "name": "Maximilian Berger",
    "email": "maximilian.berger@example.com",
    "phone": "+43 760806741",
    "createdAt": "2026-03-03T13:09:34.305Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian191",
    "address": {
      "street": "Wiesenweg 3",
      "city": "Linz",
      "zip": "6620",
      "country": "Österreich"
    },
    "nameLower": "maximilian berger",
    "abholadresse": {
      "strasse": "Wiesenweg 3, Linz",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 48, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_192",
    "kundenNummer": "HUBI1192",
    "name": "Julia Eder",
    "email": "julia.eder@example.com",
    "phone": "+43 857830210",
    "createdAt": "2026-01-25T19:23:26.126Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia192",
    "address": {
      "street": "Kirchenplatz 62",
      "city": "Salzburg",
      "zip": "9549",
      "country": "Österreich"
    },
    "nameLower": "julia eder",
    "abholadresse": {
      "strasse": "Kirchenplatz 62, Salzburg",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 30, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "1",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_193",
    "kundenNummer": "HUBI1193",
    "name": "Sarah Gruber",
    "email": "sarah.gruber@example.com",
    "phone": "+43 643628465",
    "createdAt": "2025-11-29T10:44:29.638Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah193",
    "address": {
      "street": "Dorfstraße 58",
      "city": "Wels",
      "zip": "8803",
      "country": "Österreich"
    },
    "nameLower": "sarah gruber",
    "abholadresse": {
      "strasse": "Dorfstraße 58, Wels",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 1, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_194",
    "kundenNummer": "HUBI1194",
    "name": "David Reiter",
    "email": "david.reiter@example.com",
    "phone": "+43 113961365",
    "createdAt": "2025-03-26T21:47:47.664Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David194",
    "address": {
      "street": "Lindenweg 56",
      "city": "Graz",
      "zip": "3776",
      "country": "Österreich"
    },
    "nameLower": "david reiter",
    "abholadresse": {
      "strasse": "Lindenweg 56, Graz",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Waldstraße 96, Wels",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "29",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_195",
    "kundenNummer": "HUBI1195",
    "name": "Lukas Winkler",
    "email": "lukas.winkler@example.com",
    "phone": "+43 506570990",
    "createdAt": "2025-03-05T00:01:33.929Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas195",
    "address": {
      "street": "Waldstraße 14",
      "city": "Linz",
      "zip": "7026",
      "country": "Österreich"
    },
    "nameLower": "lukas winkler",
    "abholadresse": {
      "strasse": "Waldstraße 14, Linz",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Waldstraße 68, Villach",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_196",
    "kundenNummer": "HUBI1196",
    "name": "Alexander Weber",
    "email": "alexander.weber@example.com",
    "phone": "+43 240508035",
    "createdAt": "2025-09-12T07:43:31.241Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander196",
    "address": {
      "street": "Bahnhofstraße 4",
      "city": "Dornbirn",
      "zip": "1241",
      "country": "Österreich"
    },
    "nameLower": "alexander weber",
    "abholadresse": {
      "strasse": "Bahnhofstraße 4, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 1, Wels",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "10",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_197",
    "kundenNummer": "HUBI1197",
    "name": "Michael Bauer",
    "email": "michael.bauer@example.com",
    "phone": "+43 744739239",
    "createdAt": "2026-04-20T20:51:37.319Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael197",
    "address": {
      "street": "Gartenstraße 49",
      "city": "Salzburg",
      "zip": "3772",
      "country": "Österreich"
    },
    "nameLower": "michael bauer",
    "abholadresse": {
      "strasse": "Gartenstraße 49, Salzburg",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 79, Salzburg",
      "stockwerk": "0",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_198",
    "kundenNummer": "HUBI1198",
    "name": "Katharina Schmidt",
    "email": "katharina.schmidt@example.com",
    "phone": "+43 572249164",
    "createdAt": "2025-06-25T20:32:41.270Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina198",
    "address": {
      "street": "Lindenweg 67",
      "city": "Villach",
      "zip": "7008",
      "country": "Österreich"
    },
    "nameLower": "katharina schmidt",
    "abholadresse": {
      "strasse": "Lindenweg 67, Villach",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Feldgasse 20, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_199",
    "kundenNummer": "HUBI1199",
    "name": "Michael Wagner",
    "email": "michael.wagner@example.com",
    "phone": "+43 596179562",
    "createdAt": "2025-10-19T18:12:22.821Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael199",
    "address": {
      "street": "Hauptstraße 66",
      "city": "Dornbirn",
      "zip": "9595",
      "country": "Österreich"
    },
    "nameLower": "michael wagner",
    "abholadresse": {
      "strasse": "Hauptstraße 66, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 33, Linz",
      "stockwerk": "1",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_200",
    "kundenNummer": "HUBI1200",
    "name": "Michael Schmid",
    "email": "michael.schmid@example.com",
    "phone": "+43 207644032",
    "createdAt": "2025-08-27T04:24:17.533Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael200",
    "address": {
      "street": "Bahnhofstraße 69",
      "city": "Villach",
      "zip": "4473",
      "country": "Österreich"
    },
    "nameLower": "michael schmid",
    "abholadresse": {
      "strasse": "Bahnhofstraße 69, Villach",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Feldgasse 53, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "2",
      "mittlereUmzugskartons": "5",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_201",
    "kundenNummer": "HUBI1201",
    "name": "Sarah Eder",
    "email": "sarah.eder@example.com",
    "phone": "+43 360969415",
    "createdAt": "2025-12-08T02:49:03.847Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah201",
    "address": {
      "street": "Feldgasse 95",
      "city": "Innsbruck",
      "zip": "1451",
      "country": "Österreich"
    },
    "nameLower": "sarah eder",
    "abholadresse": {
      "strasse": "Feldgasse 95, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 82, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_202",
    "kundenNummer": "HUBI1202",
    "name": "Anna Gruber",
    "email": "anna.gruber@example.com",
    "phone": "+43 565659308",
    "createdAt": "2025-10-27T05:58:06.760Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna202",
    "address": {
      "street": "Bergstraße 5",
      "city": "Salzburg",
      "zip": "6760",
      "country": "Österreich"
    },
    "nameLower": "anna gruber",
    "abholadresse": {
      "strasse": "Bergstraße 5, Salzburg",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Feldgasse 32, Salzburg",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "9",
      "mittlereUmzugskartons": "29",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_203",
    "kundenNummer": "HUBI1203",
    "name": "Katharina Hofer",
    "email": "katharina.hofer@example.com",
    "phone": "+43 615252996",
    "createdAt": "2025-03-11T04:05:13.581Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina203",
    "address": {
      "street": "Gartenstraße 26",
      "city": "Wien",
      "zip": "9537",
      "country": "Österreich"
    },
    "nameLower": "katharina hofer",
    "abholadresse": {
      "strasse": "Gartenstraße 26, Wien",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 76, Wien",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_204",
    "kundenNummer": "HUBI1204",
    "name": "David Schmid",
    "email": "david.schmid@example.com",
    "phone": "+43 444340894",
    "createdAt": "2025-03-02T02:17:58.575Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David204",
    "address": {
      "street": "Bergstraße 86",
      "city": "Wels",
      "zip": "3071",
      "country": "Österreich"
    },
    "nameLower": "david schmid",
    "abholadresse": {
      "strasse": "Bergstraße 86, Wels",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 81, Villach",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "3",
      "mittlereUmzugskartons": "17",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_205",
    "kundenNummer": "HUBI1205",
    "name": "Laura Eder",
    "email": "laura.eder@example.com",
    "phone": "+43 245943592",
    "createdAt": "2026-01-02T17:34:40.525Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura205",
    "address": {
      "street": "Bahnhofstraße 96",
      "city": "St. Pölten",
      "zip": "3921",
      "country": "Österreich"
    },
    "nameLower": "laura eder",
    "abholadresse": {
      "strasse": "Bahnhofstraße 96, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 19, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "18",
      "mittlereUmzugskartons": "27",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_206",
    "kundenNummer": "HUBI1206",
    "name": "Sophie Fischer",
    "email": "sophie.fischer@example.com",
    "phone": "+43 621000286",
    "createdAt": "2026-05-31T07:02:44.226Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie206",
    "address": {
      "street": "Lindenweg 70",
      "city": "Wien",
      "zip": "9043",
      "country": "Österreich"
    },
    "nameLower": "sophie fischer",
    "abholadresse": {
      "strasse": "Lindenweg 70, Wien",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bergstraße 99, Wien",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "17",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_207",
    "kundenNummer": "HUBI1207",
    "name": "Thomas Huber",
    "email": "thomas.huber@example.com",
    "phone": "+43 423129903",
    "createdAt": "2025-03-23T07:12:10.120Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas207",
    "address": {
      "street": "Lindenweg 3",
      "city": "Wels",
      "zip": "1411",
      "country": "Österreich"
    },
    "nameLower": "thomas huber",
    "abholadresse": {
      "strasse": "Lindenweg 3, Wels",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Waldstraße 22, Wels",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "20",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_208",
    "kundenNummer": "HUBI1208",
    "name": "Michael Müller",
    "email": "michael.müller@example.com",
    "phone": "+43 263065714",
    "createdAt": "2025-09-07T18:06:07.679Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael208",
    "address": {
      "street": "Bahnhofstraße 93",
      "city": "Linz",
      "zip": "1407",
      "country": "Österreich"
    },
    "nameLower": "michael müller",
    "abholadresse": {
      "strasse": "Bahnhofstraße 93, Linz",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Lindenweg 0, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_209",
    "kundenNummer": "HUBI1209",
    "name": "Maximilian Eder",
    "email": "maximilian.eder@example.com",
    "phone": "+43 599093364",
    "createdAt": "2026-01-10T20:04:12.726Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian209",
    "address": {
      "street": "Bergstraße 45",
      "city": "Salzburg",
      "zip": "1889",
      "country": "Österreich"
    },
    "nameLower": "maximilian eder",
    "abholadresse": {
      "strasse": "Bergstraße 45, Salzburg",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 89, Villach",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "28",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_210",
    "kundenNummer": "HUBI1210",
    "name": "Christina Fuchs",
    "email": "christina.fuchs@example.com",
    "phone": "+43 325757733",
    "createdAt": "2025-11-04T05:36:14.769Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina210",
    "address": {
      "street": "Feldgasse 18",
      "city": "Wien",
      "zip": "8272",
      "country": "Österreich"
    },
    "nameLower": "christina fuchs",
    "abholadresse": {
      "strasse": "Feldgasse 18, Wien",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 55, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "18",
      "mittlereUmzugskartons": "15",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_211",
    "kundenNummer": "HUBI1211",
    "name": "Alexander Weber",
    "email": "alexander.weber@example.com",
    "phone": "+43 911407809",
    "createdAt": "2026-02-21T09:27:37.744Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander211",
    "address": {
      "street": "Hauptstraße 46",
      "city": "Wien",
      "zip": "2731",
      "country": "Österreich"
    },
    "nameLower": "alexander weber",
    "abholadresse": {
      "strasse": "Hauptstraße 46, Wien",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 48, Graz",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "4",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_212",
    "kundenNummer": "HUBI1212",
    "name": "Maximilian Winkler",
    "email": "maximilian.winkler@example.com",
    "phone": "+43 664945007",
    "createdAt": "2025-12-05T20:26:05.103Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian212",
    "address": {
      "street": "Rathausplatz 71",
      "city": "St. Pölten",
      "zip": "3548",
      "country": "Österreich"
    },
    "nameLower": "maximilian winkler",
    "abholadresse": {
      "strasse": "Rathausplatz 71, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 66, Linz",
      "stockwerk": "1",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_213",
    "kundenNummer": "HUBI1213",
    "name": "Thomas Winkler",
    "email": "thomas.winkler@example.com",
    "phone": "+43 594473303",
    "createdAt": "2026-01-23T12:58:04.661Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas213",
    "address": {
      "street": "Wiesenweg 84",
      "city": "Dornbirn",
      "zip": "5131",
      "country": "Österreich"
    },
    "nameLower": "thomas winkler",
    "abholadresse": {
      "strasse": "Wiesenweg 84, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 59, Graz",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_214",
    "kundenNummer": "HUBI1214",
    "name": "Alexander Wagner",
    "email": "alexander.wagner@example.com",
    "phone": "+43 164713853",
    "createdAt": "2025-07-30T21:09:46.408Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander214",
    "address": {
      "street": "Wiesenweg 2",
      "city": "Linz",
      "zip": "5057",
      "country": "Österreich"
    },
    "nameLower": "alexander wagner",
    "abholadresse": {
      "strasse": "Wiesenweg 2, Linz",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 70, Wien",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "19",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_215",
    "kundenNummer": "HUBI1215",
    "name": "Michael Reiter",
    "email": "michael.reiter@example.com",
    "phone": "+43 905779564",
    "createdAt": "2026-01-13T11:27:06.393Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael215",
    "address": {
      "street": "Kirchenplatz 34",
      "city": "Innsbruck",
      "zip": "2074",
      "country": "Österreich"
    },
    "nameLower": "michael reiter",
    "abholadresse": {
      "strasse": "Kirchenplatz 34, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 41, Graz",
      "stockwerk": "3",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_216",
    "kundenNummer": "HUBI1216",
    "name": "Julia Eder",
    "email": "julia.eder@example.com",
    "phone": "+43 126189090",
    "createdAt": "2025-12-28T22:53:21.944Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia216",
    "address": {
      "street": "Schulstraße 62",
      "city": "Linz",
      "zip": "7857",
      "country": "Österreich"
    },
    "nameLower": "julia eder",
    "abholadresse": {
      "strasse": "Schulstraße 62, Linz",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Schulstraße 30, Salzburg",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "4",
      "mittlereUmzugskartons": "7",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_217",
    "kundenNummer": "HUBI1217",
    "name": "Julia Pichler",
    "email": "julia.pichler@example.com",
    "phone": "+43 788549687",
    "createdAt": "2026-07-29T20:47:42.105Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia217",
    "address": {
      "street": "Hauptstraße 23",
      "city": "Dornbirn",
      "zip": "6400",
      "country": "Österreich"
    },
    "nameLower": "julia pichler",
    "abholadresse": {
      "strasse": "Hauptstraße 23, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Waldstraße 37, Wels",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "12",
      "mittlereUmzugskartons": "12",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_218",
    "kundenNummer": "HUBI1218",
    "name": "Lisa Mayer",
    "email": "lisa.mayer@example.com",
    "phone": "+43 617058170",
    "createdAt": "2026-02-01T12:52:10.615Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa218",
    "address": {
      "street": "Feldgasse 11",
      "city": "Wien",
      "zip": "5280",
      "country": "Österreich"
    },
    "nameLower": "lisa mayer",
    "abholadresse": {
      "strasse": "Feldgasse 11, Wien",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 72, Wien",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "3",
      "mittlereUmzugskartons": "23",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_219",
    "kundenNummer": "HUBI1219",
    "name": "Michael Reiter",
    "email": "michael.reiter@example.com",
    "phone": "+43 267322847",
    "createdAt": "2026-07-01T09:10:37.308Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael219",
    "address": {
      "street": "Lindenweg 94",
      "city": "Klagenfurt",
      "zip": "5496",
      "country": "Österreich"
    },
    "nameLower": "michael reiter",
    "abholadresse": {
      "strasse": "Lindenweg 94, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Lindenweg 38, Villach",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "0",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_220",
    "kundenNummer": "HUBI1220",
    "name": "Julia Koch",
    "email": "julia.koch@example.com",
    "phone": "+43 515476707",
    "createdAt": "2026-07-27T02:16:09.770Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia220",
    "address": {
      "street": "Lindenweg 14",
      "city": "Wels",
      "zip": "3096",
      "country": "Österreich"
    },
    "nameLower": "julia koch",
    "abholadresse": {
      "strasse": "Lindenweg 14, Wels",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Lindenweg 33, Wels",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "18",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_221",
    "kundenNummer": "HUBI1221",
    "name": "Sophie Eder",
    "email": "sophie.eder@example.com",
    "phone": "+43 879822384",
    "createdAt": "2025-06-10T02:52:18.051Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie221",
    "address": {
      "street": "Bahnhofstraße 1",
      "city": "St. Pölten",
      "zip": "2029",
      "country": "Österreich"
    },
    "nameLower": "sophie eder",
    "abholadresse": {
      "strasse": "Bahnhofstraße 1, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Schulstraße 88, Linz",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "17",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_222",
    "kundenNummer": "HUBI1222",
    "name": "Maria Wagner",
    "email": "maria.wagner@example.com",
    "phone": "+43 618879106",
    "createdAt": "2025-03-08T16:20:59.736Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria222",
    "address": {
      "street": "Wiesenweg 17",
      "city": "Klagenfurt",
      "zip": "6236",
      "country": "Österreich"
    },
    "nameLower": "maria wagner",
    "abholadresse": {
      "strasse": "Wiesenweg 17, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bergstraße 57, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_223",
    "kundenNummer": "HUBI1223",
    "name": "Anna Pichler",
    "email": "anna.pichler@example.com",
    "phone": "+43 603632901",
    "createdAt": "2026-03-29T00:23:14.990Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna223",
    "address": {
      "street": "Kirchenplatz 10",
      "city": "Wien",
      "zip": "4722",
      "country": "Österreich"
    },
    "nameLower": "anna pichler",
    "abholadresse": {
      "strasse": "Kirchenplatz 10, Wien",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 42, Graz",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "18",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_224",
    "kundenNummer": "HUBI1224",
    "name": "Sophie Huber",
    "email": "sophie.huber@example.com",
    "phone": "+43 444525940",
    "createdAt": "2025-01-11T19:58:50.529Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie224",
    "address": {
      "street": "Wiesenweg 4",
      "city": "Wien",
      "zip": "2039",
      "country": "Österreich"
    },
    "nameLower": "sophie huber",
    "abholadresse": {
      "strasse": "Wiesenweg 4, Wien",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 5, Villach",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "28",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_225",
    "kundenNummer": "HUBI1225",
    "name": "Sarah Mayer",
    "email": "sarah.mayer@example.com",
    "phone": "+43 968761565",
    "createdAt": "2025-03-12T12:57:15.453Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah225",
    "address": {
      "street": "Bahnhofstraße 14",
      "city": "Graz",
      "zip": "8782",
      "country": "Österreich"
    },
    "nameLower": "sarah mayer",
    "abholadresse": {
      "strasse": "Bahnhofstraße 14, Graz",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 2, Graz",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "3",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_226",
    "kundenNummer": "HUBI1226",
    "name": "Lukas Moser",
    "email": "lukas.moser@example.com",
    "phone": "+43 507944739",
    "createdAt": "2026-07-12T21:02:59.443Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas226",
    "address": {
      "street": "Bergstraße 83",
      "city": "Wels",
      "zip": "4473",
      "country": "Österreich"
    },
    "nameLower": "lukas moser",
    "abholadresse": {
      "strasse": "Bergstraße 83, Wels",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 56, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "1",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_227",
    "kundenNummer": "HUBI1227",
    "name": "Stefan Mayer",
    "email": "stefan.mayer@example.com",
    "phone": "+43 493382721",
    "createdAt": "2025-06-29T03:50:28.300Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan227",
    "address": {
      "street": "Bergstraße 3",
      "city": "Wels",
      "zip": "2347",
      "country": "Österreich"
    },
    "nameLower": "stefan mayer",
    "abholadresse": {
      "strasse": "Bergstraße 3, Wels",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 84, Salzburg",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "3",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_228",
    "kundenNummer": "HUBI1228",
    "name": "David Mayer",
    "email": "david.mayer@example.com",
    "phone": "+43 271149732",
    "createdAt": "2026-05-04T23:00:04.720Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David228",
    "address": {
      "street": "Schulstraße 21",
      "city": "Salzburg",
      "zip": "7901",
      "country": "Österreich"
    },
    "nameLower": "david mayer",
    "abholadresse": {
      "strasse": "Schulstraße 21, Salzburg",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 11, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "14",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_229",
    "kundenNummer": "HUBI1229",
    "name": "Laura Steiner",
    "email": "laura.steiner@example.com",
    "phone": "+43 709990917",
    "createdAt": "2026-01-13T01:03:30.374Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura229",
    "address": {
      "street": "Kirchenplatz 61",
      "city": "Graz",
      "zip": "2739",
      "country": "Österreich"
    },
    "nameLower": "laura steiner",
    "abholadresse": {
      "strasse": "Kirchenplatz 61, Graz",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Schulstraße 52, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_230",
    "kundenNummer": "HUBI1230",
    "name": "Martin Weber",
    "email": "martin.weber@example.com",
    "phone": "+43 145123258",
    "createdAt": "2026-07-05T03:24:18.913Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin230",
    "address": {
      "street": "Wiesenweg 5",
      "city": "Dornbirn",
      "zip": "9424",
      "country": "Österreich"
    },
    "nameLower": "martin weber",
    "abholadresse": {
      "strasse": "Wiesenweg 5, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bergstraße 55, Wels",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "25",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_231",
    "kundenNummer": "HUBI1231",
    "name": "Christina Pichler",
    "email": "christina.pichler@example.com",
    "phone": "+43 860915353",
    "createdAt": "2026-07-16T04:20:49.117Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina231",
    "address": {
      "street": "Gartenstraße 27",
      "city": "Klagenfurt",
      "zip": "2999",
      "country": "Österreich"
    },
    "nameLower": "christina pichler",
    "abholadresse": {
      "strasse": "Gartenstraße 27, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Waldstraße 34, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "29",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_232",
    "kundenNummer": "HUBI1232",
    "name": "Christina Wagner",
    "email": "christina.wagner@example.com",
    "phone": "+43 739206821",
    "createdAt": "2026-02-06T00:34:54.416Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina232",
    "address": {
      "street": "Rathausplatz 68",
      "city": "Linz",
      "zip": "7135",
      "country": "Österreich"
    },
    "nameLower": "christina wagner",
    "abholadresse": {
      "strasse": "Rathausplatz 68, Linz",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 87, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_233",
    "kundenNummer": "HUBI1233",
    "name": "Andreas Schmid",
    "email": "andreas.schmid@example.com",
    "phone": "+43 383496970",
    "createdAt": "2025-12-11T10:35:25.301Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas233",
    "address": {
      "street": "Waldstraße 14",
      "city": "St. Pölten",
      "zip": "5477",
      "country": "Österreich"
    },
    "nameLower": "andreas schmid",
    "abholadresse": {
      "strasse": "Waldstraße 14, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Waldstraße 74, Villach",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "7",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_234",
    "kundenNummer": "HUBI1234",
    "name": "Lukas Eder",
    "email": "lukas.eder@example.com",
    "phone": "+43 393346685",
    "createdAt": "2025-01-21T07:48:11.781Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas234",
    "address": {
      "street": "Bahnhofstraße 15",
      "city": "Klagenfurt",
      "zip": "4070",
      "country": "Österreich"
    },
    "nameLower": "lukas eder",
    "abholadresse": {
      "strasse": "Bahnhofstraße 15, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bergstraße 77, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_235",
    "kundenNummer": "HUBI1235",
    "name": "Elena Reiter",
    "email": "elena.reiter@example.com",
    "phone": "+43 612859890",
    "createdAt": "2026-07-16T09:56:01.349Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena235",
    "address": {
      "street": "Waldstraße 51",
      "city": "Wien",
      "zip": "5401",
      "country": "Österreich"
    },
    "nameLower": "elena reiter",
    "abholadresse": {
      "strasse": "Waldstraße 51, Wien",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 42, Graz",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "4",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_236",
    "kundenNummer": "HUBI1236",
    "name": "Andreas Winkler",
    "email": "andreas.winkler@example.com",
    "phone": "+43 963235342",
    "createdAt": "2025-06-01T16:22:12.663Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas236",
    "address": {
      "street": "Bergstraße 5",
      "city": "Wien",
      "zip": "5790",
      "country": "Österreich"
    },
    "nameLower": "andreas winkler",
    "abholadresse": {
      "strasse": "Bergstraße 5, Wien",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 3, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "14",
      "mittlereUmzugskartons": "2",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_237",
    "kundenNummer": "HUBI1237",
    "name": "Michael Moser",
    "email": "michael.moser@example.com",
    "phone": "+43 628604831",
    "createdAt": "2026-02-04T15:00:41.194Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael237",
    "address": {
      "street": "Rathausplatz 14",
      "city": "Villach",
      "zip": "8674",
      "country": "Österreich"
    },
    "nameLower": "michael moser",
    "abholadresse": {
      "strasse": "Rathausplatz 14, Villach",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bergstraße 49, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "19",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_238",
    "kundenNummer": "HUBI1238",
    "name": "Christian Weber",
    "email": "christian.weber@example.com",
    "phone": "+43 114403009",
    "createdAt": "2026-01-26T18:01:09.297Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian238",
    "address": {
      "street": "Kirchenplatz 12",
      "city": "Klagenfurt",
      "zip": "7470",
      "country": "Österreich"
    },
    "nameLower": "christian weber",
    "abholadresse": {
      "strasse": "Kirchenplatz 12, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 66, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "14",
      "mittlereUmzugskartons": "19",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_239",
    "kundenNummer": "HUBI1239",
    "name": "Sarah Berger",
    "email": "sarah.berger@example.com",
    "phone": "+43 890533926",
    "createdAt": "2025-10-02T02:18:29.865Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah239",
    "address": {
      "street": "Rathausplatz 7",
      "city": "Innsbruck",
      "zip": "3084",
      "country": "Österreich"
    },
    "nameLower": "sarah berger",
    "abholadresse": {
      "strasse": "Rathausplatz 7, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 68, Wien",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "9",
      "mittlereUmzugskartons": "29",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_240",
    "kundenNummer": "HUBI1240",
    "name": "Andreas Wagner",
    "email": "andreas.wagner@example.com",
    "phone": "+43 252900409",
    "createdAt": "2025-05-24T08:29:52.919Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas240",
    "address": {
      "street": "Waldstraße 38",
      "city": "Graz",
      "zip": "1030",
      "country": "Österreich"
    },
    "nameLower": "andreas wagner",
    "abholadresse": {
      "strasse": "Waldstraße 38, Graz",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 30, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "12",
      "mittlereUmzugskartons": "6",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_241",
    "kundenNummer": "HUBI1241",
    "name": "Julia Müller",
    "email": "julia.müller@example.com",
    "phone": "+43 827177159",
    "createdAt": "2025-03-13T07:38:30.282Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia241",
    "address": {
      "street": "Gartenstraße 98",
      "city": "Linz",
      "zip": "5611",
      "country": "Österreich"
    },
    "nameLower": "julia müller",
    "abholadresse": {
      "strasse": "Gartenstraße 98, Linz",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Feldgasse 9, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "2",
      "mittlereUmzugskartons": "11",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_242",
    "kundenNummer": "HUBI1242",
    "name": "Christian Schmidt",
    "email": "christian.schmidt@example.com",
    "phone": "+43 619355210",
    "createdAt": "2026-02-14T05:16:41.279Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian242",
    "address": {
      "street": "Schulstraße 48",
      "city": "Linz",
      "zip": "1578",
      "country": "Österreich"
    },
    "nameLower": "christian schmidt",
    "abholadresse": {
      "strasse": "Schulstraße 48, Linz",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 96, Linz",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "9",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_243",
    "kundenNummer": "HUBI1243",
    "name": "David Bauer",
    "email": "david.bauer@example.com",
    "phone": "+43 112296658",
    "createdAt": "2025-07-21T04:39:06.738Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David243",
    "address": {
      "street": "Waldstraße 66",
      "city": "Wien",
      "zip": "6284",
      "country": "Österreich"
    },
    "nameLower": "david bauer",
    "abholadresse": {
      "strasse": "Waldstraße 66, Wien",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 10, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "20",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_244",
    "kundenNummer": "HUBI1244",
    "name": "Anna Berger",
    "email": "anna.berger@example.com",
    "phone": "+43 336343512",
    "createdAt": "2025-11-11T13:35:55.428Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna244",
    "address": {
      "street": "Schulstraße 69",
      "city": "Wien",
      "zip": "5050",
      "country": "Österreich"
    },
    "nameLower": "anna berger",
    "abholadresse": {
      "strasse": "Schulstraße 69, Wien",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bergstraße 74, Linz",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "11",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_245",
    "kundenNummer": "HUBI1245",
    "name": "Katharina Berger",
    "email": "katharina.berger@example.com",
    "phone": "+43 614482959",
    "createdAt": "2025-10-08T15:09:23.339Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina245",
    "address": {
      "street": "Bahnhofstraße 41",
      "city": "Wels",
      "zip": "4910",
      "country": "Österreich"
    },
    "nameLower": "katharina berger",
    "abholadresse": {
      "strasse": "Bahnhofstraße 41, Wels",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Schulstraße 49, Linz",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "4",
      "mittlereUmzugskartons": "15",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_246",
    "kundenNummer": "HUBI1246",
    "name": "David Fuchs",
    "email": "david.fuchs@example.com",
    "phone": "+43 313791210",
    "createdAt": "2025-07-21T22:51:50.152Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David246",
    "address": {
      "street": "Wiesenweg 17",
      "city": "Linz",
      "zip": "1432",
      "country": "Österreich"
    },
    "nameLower": "david fuchs",
    "abholadresse": {
      "strasse": "Wiesenweg 17, Linz",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 31, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_247",
    "kundenNummer": "HUBI1247",
    "name": "Maximilian Pichler",
    "email": "maximilian.pichler@example.com",
    "phone": "+43 410158280",
    "createdAt": "2026-05-10T14:15:51.511Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian247",
    "address": {
      "street": "Waldstraße 63",
      "city": "Wien",
      "zip": "1625",
      "country": "Österreich"
    },
    "nameLower": "maximilian pichler",
    "abholadresse": {
      "strasse": "Waldstraße 63, Wien",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 99, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "22",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_248",
    "kundenNummer": "HUBI1248",
    "name": "Anna Fuchs",
    "email": "anna.fuchs@example.com",
    "phone": "+43 770238011",
    "createdAt": "2025-02-28T07:29:37.854Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna248",
    "address": {
      "street": "Kirchenplatz 34",
      "city": "Salzburg",
      "zip": "4875",
      "country": "Österreich"
    },
    "nameLower": "anna fuchs",
    "abholadresse": {
      "strasse": "Kirchenplatz 34, Salzburg",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 27, Linz",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_249",
    "kundenNummer": "HUBI1249",
    "name": "Andreas Schmidt",
    "email": "andreas.schmidt@example.com",
    "phone": "+43 650093506",
    "createdAt": "2025-11-24T09:02:24.198Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas249",
    "address": {
      "street": "Lindenweg 8",
      "city": "Salzburg",
      "zip": "2750",
      "country": "Österreich"
    },
    "nameLower": "andreas schmidt",
    "abholadresse": {
      "strasse": "Lindenweg 8, Salzburg",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 92, Salzburg",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "18",
      "mittlereUmzugskartons": "19",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_250",
    "kundenNummer": "HUBI1250",
    "name": "Martin Müller",
    "email": "martin.müller@example.com",
    "phone": "+43 399428576",
    "createdAt": "2025-02-21T02:30:28.380Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin250",
    "address": {
      "street": "Kirchenplatz 0",
      "city": "Wels",
      "zip": "8011",
      "country": "Österreich"
    },
    "nameLower": "martin müller",
    "abholadresse": {
      "strasse": "Kirchenplatz 0, Wels",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Schulstraße 60, Villach",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "18",
      "mittlereUmzugskartons": "5",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_251",
    "kundenNummer": "HUBI1251",
    "name": "Julia Bauer",
    "email": "julia.bauer@example.com",
    "phone": "+43 284560211",
    "createdAt": "2025-09-28T09:08:07.496Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia251",
    "address": {
      "street": "Waldstraße 98",
      "city": "Salzburg",
      "zip": "4906",
      "country": "Österreich"
    },
    "nameLower": "julia bauer",
    "abholadresse": {
      "strasse": "Waldstraße 98, Salzburg",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 89, Graz",
      "stockwerk": "4",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_252",
    "kundenNummer": "HUBI1252",
    "name": "Christian Gruber",
    "email": "christian.gruber@example.com",
    "phone": "+43 465975426",
    "createdAt": "2025-06-03T14:08:26.614Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian252",
    "address": {
      "street": "Bahnhofstraße 87",
      "city": "Wels",
      "zip": "8807",
      "country": "Österreich"
    },
    "nameLower": "christian gruber",
    "abholadresse": {
      "strasse": "Bahnhofstraße 87, Wels",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 19, Wels",
      "stockwerk": "4",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_253",
    "kundenNummer": "HUBI1253",
    "name": "Julia Weber",
    "email": "julia.weber@example.com",
    "phone": "+43 547907811",
    "createdAt": "2026-07-27T02:33:59.353Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia253",
    "address": {
      "street": "Hauptstraße 98",
      "city": "Wels",
      "zip": "4550",
      "country": "Österreich"
    },
    "nameLower": "julia weber",
    "abholadresse": {
      "strasse": "Hauptstraße 98, Wels",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Schulstraße 30, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_254",
    "kundenNummer": "HUBI1254",
    "name": "Sarah Steiner",
    "email": "sarah.steiner@example.com",
    "phone": "+43 693620848",
    "createdAt": "2026-06-26T05:19:29.311Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah254",
    "address": {
      "street": "Schulstraße 95",
      "city": "Graz",
      "zip": "9472",
      "country": "Österreich"
    },
    "nameLower": "sarah steiner",
    "abholadresse": {
      "strasse": "Schulstraße 95, Graz",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Waldstraße 37, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "25",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_255",
    "kundenNummer": "HUBI1255",
    "name": "Lisa Schmidt",
    "email": "lisa.schmidt@example.com",
    "phone": "+43 404019516",
    "createdAt": "2026-02-14T22:29:16.081Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa255",
    "address": {
      "street": "Wiesenweg 22",
      "city": "Salzburg",
      "zip": "5373",
      "country": "Österreich"
    },
    "nameLower": "lisa schmidt",
    "abholadresse": {
      "strasse": "Wiesenweg 22, Salzburg",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 29, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "6",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_256",
    "kundenNummer": "HUBI1256",
    "name": "Lisa Winkler",
    "email": "lisa.winkler@example.com",
    "phone": "+43 363531596",
    "createdAt": "2025-10-04T05:51:23.172Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa256",
    "address": {
      "street": "Wiesenweg 3",
      "city": "Klagenfurt",
      "zip": "3386",
      "country": "Österreich"
    },
    "nameLower": "lisa winkler",
    "abholadresse": {
      "strasse": "Wiesenweg 3, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 96, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "5",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_257",
    "kundenNummer": "HUBI1257",
    "name": "Lukas Bauer",
    "email": "lukas.bauer@example.com",
    "phone": "+43 445382140",
    "createdAt": "2026-04-15T04:39:16.798Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas257",
    "address": {
      "street": "Bahnhofstraße 47",
      "city": "Graz",
      "zip": "1663",
      "country": "Österreich"
    },
    "nameLower": "lukas bauer",
    "abholadresse": {
      "strasse": "Bahnhofstraße 47, Graz",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 51, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_258",
    "kundenNummer": "HUBI1258",
    "name": "Maximilian Winkler",
    "email": "maximilian.winkler@example.com",
    "phone": "+43 231935080",
    "createdAt": "2026-03-25T02:25:51.091Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian258",
    "address": {
      "street": "Feldgasse 45",
      "city": "Innsbruck",
      "zip": "6632",
      "country": "Österreich"
    },
    "nameLower": "maximilian winkler",
    "abholadresse": {
      "strasse": "Feldgasse 45, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Lindenweg 51, Salzburg",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "17",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_259",
    "kundenNummer": "HUBI1259",
    "name": "Christina Moser",
    "email": "christina.moser@example.com",
    "phone": "+43 430037812",
    "createdAt": "2025-11-11T19:41:01.467Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina259",
    "address": {
      "street": "Kirchenplatz 93",
      "city": "Wels",
      "zip": "8350",
      "country": "Österreich"
    },
    "nameLower": "christina moser",
    "abholadresse": {
      "strasse": "Kirchenplatz 93, Wels",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 6, Wels",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "9",
      "mittlereUmzugskartons": "5",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_260",
    "kundenNummer": "HUBI1260",
    "name": "Martin Huber",
    "email": "martin.huber@example.com",
    "phone": "+43 861692560",
    "createdAt": "2025-03-07T21:04:57.706Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin260",
    "address": {
      "street": "Kirchenplatz 21",
      "city": "Dornbirn",
      "zip": "1469",
      "country": "Österreich"
    },
    "nameLower": "martin huber",
    "abholadresse": {
      "strasse": "Kirchenplatz 21, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 88, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_261",
    "kundenNummer": "HUBI1261",
    "name": "Julia Reiter",
    "email": "julia.reiter@example.com",
    "phone": "+43 436917283",
    "createdAt": "2025-09-16T01:42:26.486Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia261",
    "address": {
      "street": "Gartenstraße 88",
      "city": "Wien",
      "zip": "1641",
      "country": "Österreich"
    },
    "nameLower": "julia reiter",
    "abholadresse": {
      "strasse": "Gartenstraße 88, Wien",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 86, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "2",
      "mittlereUmzugskartons": "17",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_262",
    "kundenNummer": "HUBI1262",
    "name": "Christian Eder",
    "email": "christian.eder@example.com",
    "phone": "+43 728727998",
    "createdAt": "2025-05-19T10:52:51.235Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian262",
    "address": {
      "street": "Wiesenweg 80",
      "city": "Villach",
      "zip": "2020",
      "country": "Österreich"
    },
    "nameLower": "christian eder",
    "abholadresse": {
      "strasse": "Wiesenweg 80, Villach",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 34, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "2",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_263",
    "kundenNummer": "HUBI1263",
    "name": "Thomas Hofer",
    "email": "thomas.hofer@example.com",
    "phone": "+43 281697316",
    "createdAt": "2025-09-04T00:44:36.860Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas263",
    "address": {
      "street": "Waldstraße 47",
      "city": "Dornbirn",
      "zip": "5587",
      "country": "Österreich"
    },
    "nameLower": "thomas hofer",
    "abholadresse": {
      "strasse": "Waldstraße 47, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 38, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_264",
    "kundenNummer": "HUBI1264",
    "name": "Anna Gruber",
    "email": "anna.gruber@example.com",
    "phone": "+43 756500480",
    "createdAt": "2026-07-22T10:35:38.824Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna264",
    "address": {
      "street": "Wiesenweg 59",
      "city": "Dornbirn",
      "zip": "3741",
      "country": "Österreich"
    },
    "nameLower": "anna gruber",
    "abholadresse": {
      "strasse": "Wiesenweg 59, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Schulstraße 75, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "7",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_265",
    "kundenNummer": "HUBI1265",
    "name": "Stefan Reiter",
    "email": "stefan.reiter@example.com",
    "phone": "+43 672935434",
    "createdAt": "2025-11-25T11:44:15.409Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan265",
    "address": {
      "street": "Rathausplatz 29",
      "city": "Dornbirn",
      "zip": "9243",
      "country": "Österreich"
    },
    "nameLower": "stefan reiter",
    "abholadresse": {
      "strasse": "Rathausplatz 29, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 77, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "20",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_266",
    "kundenNummer": "HUBI1266",
    "name": "Lukas Müller",
    "email": "lukas.müller@example.com",
    "phone": "+43 239531326",
    "createdAt": "2026-01-09T20:49:15.155Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas266",
    "address": {
      "street": "Bahnhofstraße 55",
      "city": "Innsbruck",
      "zip": "7931",
      "country": "Österreich"
    },
    "nameLower": "lukas müller",
    "abholadresse": {
      "strasse": "Bahnhofstraße 55, Innsbruck",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Feldgasse 62, Wien",
      "stockwerk": "0",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_267",
    "kundenNummer": "HUBI1267",
    "name": "Julia Bauer",
    "email": "julia.bauer@example.com",
    "phone": "+43 751854395",
    "createdAt": "2025-04-21T18:28:36.598Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia267",
    "address": {
      "street": "Rathausplatz 27",
      "city": "St. Pölten",
      "zip": "9645",
      "country": "Österreich"
    },
    "nameLower": "julia bauer",
    "abholadresse": {
      "strasse": "Rathausplatz 27, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Feldgasse 37, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "25",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_268",
    "kundenNummer": "HUBI1268",
    "name": "Katharina Schmidt",
    "email": "katharina.schmidt@example.com",
    "phone": "+43 357001700",
    "createdAt": "2026-07-25T23:04:17.798Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina268",
    "address": {
      "street": "Waldstraße 16",
      "city": "Wels",
      "zip": "5976",
      "country": "Österreich"
    },
    "nameLower": "katharina schmidt",
    "abholadresse": {
      "strasse": "Waldstraße 16, Wels",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 38, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "9",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_269",
    "kundenNummer": "HUBI1269",
    "name": "Anna Huber",
    "email": "anna.huber@example.com",
    "phone": "+43 597074583",
    "createdAt": "2025-12-01T13:41:18.923Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna269",
    "address": {
      "street": "Feldgasse 73",
      "city": "Innsbruck",
      "zip": "9126",
      "country": "Österreich"
    },
    "nameLower": "anna huber",
    "abholadresse": {
      "strasse": "Feldgasse 73, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 57, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_270",
    "kundenNummer": "HUBI1270",
    "name": "Alexander Gruber",
    "email": "alexander.gruber@example.com",
    "phone": "+43 513077446",
    "createdAt": "2025-07-25T03:41:06.359Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander270",
    "address": {
      "street": "Schulstraße 7",
      "city": "Wels",
      "zip": "7818",
      "country": "Österreich"
    },
    "nameLower": "alexander gruber",
    "abholadresse": {
      "strasse": "Schulstraße 7, Wels",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Waldstraße 22, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_271",
    "kundenNummer": "HUBI1271",
    "name": "Elena Hofer",
    "email": "elena.hofer@example.com",
    "phone": "+43 107642343",
    "createdAt": "2025-10-01T05:50:27.132Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena271",
    "address": {
      "street": "Hauptstraße 98",
      "city": "Innsbruck",
      "zip": "7570",
      "country": "Österreich"
    },
    "nameLower": "elena hofer",
    "abholadresse": {
      "strasse": "Hauptstraße 98, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 13, Linz",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "6",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_272",
    "kundenNummer": "HUBI1272",
    "name": "Laura Winkler",
    "email": "laura.winkler@example.com",
    "phone": "+43 438546908",
    "createdAt": "2026-07-06T19:48:07.438Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura272",
    "address": {
      "street": "Waldstraße 89",
      "city": "Graz",
      "zip": "9782",
      "country": "Österreich"
    },
    "nameLower": "laura winkler",
    "abholadresse": {
      "strasse": "Waldstraße 89, Graz",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Schulstraße 80, Wien",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_273",
    "kundenNummer": "HUBI1273",
    "name": "Lisa Schmid",
    "email": "lisa.schmid@example.com",
    "phone": "+43 247099691",
    "createdAt": "2025-04-30T10:37:28.074Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa273",
    "address": {
      "street": "Gartenstraße 40",
      "city": "Salzburg",
      "zip": "8119",
      "country": "Österreich"
    },
    "nameLower": "lisa schmid",
    "abholadresse": {
      "strasse": "Gartenstraße 40, Salzburg",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 15, Wels",
      "stockwerk": "1",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_274",
    "kundenNummer": "HUBI1274",
    "name": "Lukas Pichler",
    "email": "lukas.pichler@example.com",
    "phone": "+43 424675140",
    "createdAt": "2025-08-19T17:26:32.370Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas274",
    "address": {
      "street": "Wiesenweg 31",
      "city": "Graz",
      "zip": "2435",
      "country": "Österreich"
    },
    "nameLower": "lukas pichler",
    "abholadresse": {
      "strasse": "Wiesenweg 31, Graz",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Feldgasse 41, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "28",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_275",
    "kundenNummer": "HUBI1275",
    "name": "Anna Schmid",
    "email": "anna.schmid@example.com",
    "phone": "+43 974705659",
    "createdAt": "2025-04-30T14:02:41.470Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna275",
    "address": {
      "street": "Feldgasse 60",
      "city": "Klagenfurt",
      "zip": "2840",
      "country": "Österreich"
    },
    "nameLower": "anna schmid",
    "abholadresse": {
      "strasse": "Feldgasse 60, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 46, Wien",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "5",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_276",
    "kundenNummer": "HUBI1276",
    "name": "Lisa Schmid",
    "email": "lisa.schmid@example.com",
    "phone": "+43 100399332",
    "createdAt": "2025-02-04T14:42:17.899Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa276",
    "address": {
      "street": "Feldgasse 90",
      "city": "Graz",
      "zip": "1424",
      "country": "Österreich"
    },
    "nameLower": "lisa schmid",
    "abholadresse": {
      "strasse": "Feldgasse 90, Graz",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 21, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "25",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_277",
    "kundenNummer": "HUBI1277",
    "name": "Martin Berger",
    "email": "martin.berger@example.com",
    "phone": "+43 300106104",
    "createdAt": "2025-04-23T06:43:38.655Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin277",
    "address": {
      "street": "Schulstraße 89",
      "city": "Linz",
      "zip": "7898",
      "country": "Österreich"
    },
    "nameLower": "martin berger",
    "abholadresse": {
      "strasse": "Schulstraße 89, Linz",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Feldgasse 63, Graz",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_278",
    "kundenNummer": "HUBI1278",
    "name": "Alexander Koch",
    "email": "alexander.koch@example.com",
    "phone": "+43 502543792",
    "createdAt": "2026-02-09T00:05:52.443Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander278",
    "address": {
      "street": "Wiesenweg 35",
      "city": "Villach",
      "zip": "7240",
      "country": "Österreich"
    },
    "nameLower": "alexander koch",
    "abholadresse": {
      "strasse": "Wiesenweg 35, Villach",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 5, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_279",
    "kundenNummer": "HUBI1279",
    "name": "Anna Huber",
    "email": "anna.huber@example.com",
    "phone": "+43 984523502",
    "createdAt": "2025-11-01T09:01:04.255Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna279",
    "address": {
      "street": "Gartenstraße 19",
      "city": "Salzburg",
      "zip": "2018",
      "country": "Österreich"
    },
    "nameLower": "anna huber",
    "abholadresse": {
      "strasse": "Gartenstraße 19, Salzburg",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 72, Wien",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "11",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_280",
    "kundenNummer": "HUBI1280",
    "name": "Julia Winkler",
    "email": "julia.winkler@example.com",
    "phone": "+43 292471986",
    "createdAt": "2025-12-11T04:34:59.064Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia280",
    "address": {
      "street": "Gartenstraße 88",
      "city": "Innsbruck",
      "zip": "6549",
      "country": "Österreich"
    },
    "nameLower": "julia winkler",
    "abholadresse": {
      "strasse": "Gartenstraße 88, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 59, Graz",
      "stockwerk": "3",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_281",
    "kundenNummer": "HUBI1281",
    "name": "Christian Wagner",
    "email": "christian.wagner@example.com",
    "phone": "+43 960319595",
    "createdAt": "2026-04-29T08:52:06.091Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian281",
    "address": {
      "street": "Waldstraße 9",
      "city": "Wels",
      "zip": "9080",
      "country": "Österreich"
    },
    "nameLower": "christian wagner",
    "abholadresse": {
      "strasse": "Waldstraße 9, Wels",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bergstraße 96, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "21",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_282",
    "kundenNummer": "HUBI1282",
    "name": "David Berger",
    "email": "david.berger@example.com",
    "phone": "+43 287811166",
    "createdAt": "2026-05-14T03:15:59.357Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David282",
    "address": {
      "street": "Waldstraße 50",
      "city": "Wels",
      "zip": "6842",
      "country": "Österreich"
    },
    "nameLower": "david berger",
    "abholadresse": {
      "strasse": "Waldstraße 50, Wels",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 95, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "8",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_283",
    "kundenNummer": "HUBI1283",
    "name": "Sophie Schmid",
    "email": "sophie.schmid@example.com",
    "phone": "+43 755442653",
    "createdAt": "2026-01-18T00:07:53.513Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie283",
    "address": {
      "street": "Wiesenweg 29",
      "city": "Villach",
      "zip": "3433",
      "country": "Österreich"
    },
    "nameLower": "sophie schmid",
    "abholadresse": {
      "strasse": "Wiesenweg 29, Villach",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 76, Graz",
      "stockwerk": "3",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_284",
    "kundenNummer": "HUBI1284",
    "name": "Elena Bauer",
    "email": "elena.bauer@example.com",
    "phone": "+43 305822674",
    "createdAt": "2025-03-04T17:24:46.980Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena284",
    "address": {
      "street": "Rathausplatz 79",
      "city": "St. Pölten",
      "zip": "8351",
      "country": "Österreich"
    },
    "nameLower": "elena bauer",
    "abholadresse": {
      "strasse": "Rathausplatz 79, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 53, Wien",
      "stockwerk": "4",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_285",
    "kundenNummer": "HUBI1285",
    "name": "Michael Schmidt",
    "email": "michael.schmidt@example.com",
    "phone": "+43 809037323",
    "createdAt": "2026-05-15T01:31:14.410Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael285",
    "address": {
      "street": "Hauptstraße 40",
      "city": "Wien",
      "zip": "7573",
      "country": "Österreich"
    },
    "nameLower": "michael schmidt",
    "abholadresse": {
      "strasse": "Hauptstraße 40, Wien",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 3, Wien",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "19",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_286",
    "kundenNummer": "HUBI1286",
    "name": "Sarah Pichler",
    "email": "sarah.pichler@example.com",
    "phone": "+43 552087600",
    "createdAt": "2026-03-06T23:18:53.231Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah286",
    "address": {
      "street": "Schulstraße 45",
      "city": "Wien",
      "zip": "8147",
      "country": "Österreich"
    },
    "nameLower": "sarah pichler",
    "abholadresse": {
      "strasse": "Schulstraße 45, Wien",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Schulstraße 8, Salzburg",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "12",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_287",
    "kundenNummer": "HUBI1287",
    "name": "Sophie Berger",
    "email": "sophie.berger@example.com",
    "phone": "+43 860027920",
    "createdAt": "2025-03-12T08:00:59.871Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie287",
    "address": {
      "street": "Waldstraße 35",
      "city": "St. Pölten",
      "zip": "2537",
      "country": "Österreich"
    },
    "nameLower": "sophie berger",
    "abholadresse": {
      "strasse": "Waldstraße 35, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bergstraße 72, Wien",
      "stockwerk": "3",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_288",
    "kundenNummer": "HUBI1288",
    "name": "Sarah Fischer",
    "email": "sarah.fischer@example.com",
    "phone": "+43 691642947",
    "createdAt": "2026-07-02T14:51:09.293Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah288",
    "address": {
      "street": "Lindenweg 72",
      "city": "Villach",
      "zip": "4345",
      "country": "Österreich"
    },
    "nameLower": "sarah fischer",
    "abholadresse": {
      "strasse": "Lindenweg 72, Villach",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 18, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "14",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_289",
    "kundenNummer": "HUBI1289",
    "name": "Katharina Weber",
    "email": "katharina.weber@example.com",
    "phone": "+43 148534597",
    "createdAt": "2025-10-07T14:59:17.903Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina289",
    "address": {
      "street": "Bahnhofstraße 12",
      "city": "Graz",
      "zip": "1030",
      "country": "Österreich"
    },
    "nameLower": "katharina weber",
    "abholadresse": {
      "strasse": "Bahnhofstraße 12, Graz",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 7, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_290",
    "kundenNummer": "HUBI1290",
    "name": "Martin Fuchs",
    "email": "martin.fuchs@example.com",
    "phone": "+43 783317988",
    "createdAt": "2025-06-17T02:12:31.376Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin290",
    "address": {
      "street": "Schulstraße 53",
      "city": "Innsbruck",
      "zip": "7590",
      "country": "Österreich"
    },
    "nameLower": "martin fuchs",
    "abholadresse": {
      "strasse": "Schulstraße 53, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Schulstraße 75, Villach",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "3",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_291",
    "kundenNummer": "HUBI1291",
    "name": "Martin Steiner",
    "email": "martin.steiner@example.com",
    "phone": "+43 591717054",
    "createdAt": "2025-08-30T05:17:40.494Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin291",
    "address": {
      "street": "Schulstraße 90",
      "city": "St. Pölten",
      "zip": "6448",
      "country": "Österreich"
    },
    "nameLower": "martin steiner",
    "abholadresse": {
      "strasse": "Schulstraße 90, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Waldstraße 21, Graz",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "20",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_292",
    "kundenNummer": "HUBI1292",
    "name": "Martin Huber",
    "email": "martin.huber@example.com",
    "phone": "+43 131587853",
    "createdAt": "2026-03-18T07:46:27.613Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin292",
    "address": {
      "street": "Bahnhofstraße 35",
      "city": "Wels",
      "zip": "7480",
      "country": "Österreich"
    },
    "nameLower": "martin huber",
    "abholadresse": {
      "strasse": "Bahnhofstraße 35, Wels",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Waldstraße 53, Linz",
      "stockwerk": "4",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_293",
    "kundenNummer": "HUBI1293",
    "name": "Alexander Huber",
    "email": "alexander.huber@example.com",
    "phone": "+43 221604537",
    "createdAt": "2026-05-09T08:47:57.030Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander293",
    "address": {
      "street": "Feldgasse 40",
      "city": "Dornbirn",
      "zip": "2525",
      "country": "Österreich"
    },
    "nameLower": "alexander huber",
    "abholadresse": {
      "strasse": "Feldgasse 40, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 72, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "18",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_294",
    "kundenNummer": "HUBI1294",
    "name": "Sophie Reiter",
    "email": "sophie.reiter@example.com",
    "phone": "+43 145072022",
    "createdAt": "2026-04-01T09:54:10.375Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie294",
    "address": {
      "street": "Waldstraße 43",
      "city": "Wels",
      "zip": "1573",
      "country": "Österreich"
    },
    "nameLower": "sophie reiter",
    "abholadresse": {
      "strasse": "Waldstraße 43, Wels",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 78, Villach",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "3",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_295",
    "kundenNummer": "HUBI1295",
    "name": "Julia Pichler",
    "email": "julia.pichler@example.com",
    "phone": "+43 166328038",
    "createdAt": "2026-03-25T08:31:52.742Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia295",
    "address": {
      "street": "Hauptstraße 55",
      "city": "Innsbruck",
      "zip": "8189",
      "country": "Österreich"
    },
    "nameLower": "julia pichler",
    "abholadresse": {
      "strasse": "Hauptstraße 55, Innsbruck",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 84, Wien",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_296",
    "kundenNummer": "HUBI1296",
    "name": "Sarah Winkler",
    "email": "sarah.winkler@example.com",
    "phone": "+43 921427991",
    "createdAt": "2025-05-27T00:00:13.635Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah296",
    "address": {
      "street": "Hauptstraße 1",
      "city": "Graz",
      "zip": "9498",
      "country": "Österreich"
    },
    "nameLower": "sarah winkler",
    "abholadresse": {
      "strasse": "Hauptstraße 1, Graz",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 30, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "1",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_297",
    "kundenNummer": "HUBI1297",
    "name": "Anna Pichler",
    "email": "anna.pichler@example.com",
    "phone": "+43 323488757",
    "createdAt": "2026-01-03T03:13:47.916Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna297",
    "address": {
      "street": "Kirchenplatz 86",
      "city": "Wels",
      "zip": "7761",
      "country": "Österreich"
    },
    "nameLower": "anna pichler",
    "abholadresse": {
      "strasse": "Kirchenplatz 86, Wels",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 99, Graz",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "27",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_298",
    "kundenNummer": "HUBI1298",
    "name": "Sarah Fischer",
    "email": "sarah.fischer@example.com",
    "phone": "+43 788508446",
    "createdAt": "2025-12-11T13:10:50.136Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah298",
    "address": {
      "street": "Feldgasse 34",
      "city": "Villach",
      "zip": "2633",
      "country": "Österreich"
    },
    "nameLower": "sarah fischer",
    "abholadresse": {
      "strasse": "Feldgasse 34, Villach",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 43, Linz",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "23",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_299",
    "kundenNummer": "HUBI1299",
    "name": "Andreas Koch",
    "email": "andreas.koch@example.com",
    "phone": "+43 989097168",
    "createdAt": "2025-12-21T15:35:46.076Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas299",
    "address": {
      "street": "Dorfstraße 26",
      "city": "St. Pölten",
      "zip": "5604",
      "country": "Österreich"
    },
    "nameLower": "andreas koch",
    "abholadresse": {
      "strasse": "Dorfstraße 26, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 10, Salzburg",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_300",
    "kundenNummer": "HUBI1300",
    "name": "Elena Fuchs",
    "email": "elena.fuchs@example.com",
    "phone": "+43 292636452",
    "createdAt": "2025-10-06T08:12:49.597Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena300",
    "address": {
      "street": "Lindenweg 69",
      "city": "Graz",
      "zip": "9945",
      "country": "Österreich"
    },
    "nameLower": "elena fuchs",
    "abholadresse": {
      "strasse": "Lindenweg 69, Graz",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Feldgasse 43, Villach",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "23",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_301",
    "kundenNummer": "HUBI1301",
    "name": "Martin Fuchs",
    "email": "martin.fuchs@example.com",
    "phone": "+43 354930906",
    "createdAt": "2025-06-16T23:50:10.985Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin301",
    "address": {
      "street": "Wiesenweg 22",
      "city": "Dornbirn",
      "zip": "1015",
      "country": "Österreich"
    },
    "nameLower": "martin fuchs",
    "abholadresse": {
      "strasse": "Wiesenweg 22, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 21, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_302",
    "kundenNummer": "HUBI1302",
    "name": "Anna Wagner",
    "email": "anna.wagner@example.com",
    "phone": "+43 859785109",
    "createdAt": "2025-05-26T17:11:49.886Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna302",
    "address": {
      "street": "Rathausplatz 66",
      "city": "Linz",
      "zip": "2389",
      "country": "Österreich"
    },
    "nameLower": "anna wagner",
    "abholadresse": {
      "strasse": "Rathausplatz 66, Linz",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Schulstraße 3, Wels",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "0",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_303",
    "kundenNummer": "HUBI1303",
    "name": "Thomas Pichler",
    "email": "thomas.pichler@example.com",
    "phone": "+43 993613551",
    "createdAt": "2025-01-30T13:07:24.838Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas303",
    "address": {
      "street": "Rathausplatz 90",
      "city": "Villach",
      "zip": "4525",
      "country": "Österreich"
    },
    "nameLower": "thomas pichler",
    "abholadresse": {
      "strasse": "Rathausplatz 90, Villach",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 24, Villach",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_304",
    "kundenNummer": "HUBI1304",
    "name": "Michael Steiner",
    "email": "michael.steiner@example.com",
    "phone": "+43 515014015",
    "createdAt": "2025-06-12T05:57:35.988Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael304",
    "address": {
      "street": "Bahnhofstraße 32",
      "city": "Dornbirn",
      "zip": "1889",
      "country": "Österreich"
    },
    "nameLower": "michael steiner",
    "abholadresse": {
      "strasse": "Bahnhofstraße 32, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 73, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "7",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_305",
    "kundenNummer": "HUBI1305",
    "name": "Andreas Moser",
    "email": "andreas.moser@example.com",
    "phone": "+43 568717281",
    "createdAt": "2025-12-04T08:52:15.680Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas305",
    "address": {
      "street": "Gartenstraße 76",
      "city": "Klagenfurt",
      "zip": "7618",
      "country": "Österreich"
    },
    "nameLower": "andreas moser",
    "abholadresse": {
      "strasse": "Gartenstraße 76, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 77, Salzburg",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "14",
      "mittlereUmzugskartons": "8",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_306",
    "kundenNummer": "HUBI1306",
    "name": "Sophie Reiter",
    "email": "sophie.reiter@example.com",
    "phone": "+43 769704160",
    "createdAt": "2026-06-29T11:38:43.801Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie306",
    "address": {
      "street": "Gartenstraße 52",
      "city": "Villach",
      "zip": "2350",
      "country": "Österreich"
    },
    "nameLower": "sophie reiter",
    "abholadresse": {
      "strasse": "Gartenstraße 52, Villach",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 35, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_307",
    "kundenNummer": "HUBI1307",
    "name": "Michael Reiter",
    "email": "michael.reiter@example.com",
    "phone": "+43 250370103",
    "createdAt": "2025-11-26T23:08:13.336Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael307",
    "address": {
      "street": "Gartenstraße 57",
      "city": "Innsbruck",
      "zip": "7886",
      "country": "Österreich"
    },
    "nameLower": "michael reiter",
    "abholadresse": {
      "strasse": "Gartenstraße 57, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 50, Wien",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_308",
    "kundenNummer": "HUBI1308",
    "name": "Katharina Hofer",
    "email": "katharina.hofer@example.com",
    "phone": "+43 938876620",
    "createdAt": "2026-03-11T05:51:38.569Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina308",
    "address": {
      "street": "Wiesenweg 64",
      "city": "Klagenfurt",
      "zip": "7691",
      "country": "Österreich"
    },
    "nameLower": "katharina hofer",
    "abholadresse": {
      "strasse": "Wiesenweg 64, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 83, Graz",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "21",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_309",
    "kundenNummer": "HUBI1309",
    "name": "Sophie Schmid",
    "email": "sophie.schmid@example.com",
    "phone": "+43 126992460",
    "createdAt": "2025-02-21T09:08:52.317Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie309",
    "address": {
      "street": "Kirchenplatz 90",
      "city": "Dornbirn",
      "zip": "3343",
      "country": "Österreich"
    },
    "nameLower": "sophie schmid",
    "abholadresse": {
      "strasse": "Kirchenplatz 90, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Waldstraße 34, Wels",
      "stockwerk": "1",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_310",
    "kundenNummer": "HUBI1310",
    "name": "Laura Koch",
    "email": "laura.koch@example.com",
    "phone": "+43 231743768",
    "createdAt": "2026-02-16T21:26:25.992Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura310",
    "address": {
      "street": "Waldstraße 9",
      "city": "Graz",
      "zip": "6224",
      "country": "Österreich"
    },
    "nameLower": "laura koch",
    "abholadresse": {
      "strasse": "Waldstraße 9, Graz",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Schulstraße 50, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "20",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_311",
    "kundenNummer": "HUBI1311",
    "name": "Maria Wagner",
    "email": "maria.wagner@example.com",
    "phone": "+43 695290348",
    "createdAt": "2025-05-14T11:18:54.216Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria311",
    "address": {
      "street": "Rathausplatz 61",
      "city": "Linz",
      "zip": "6116",
      "country": "Österreich"
    },
    "nameLower": "maria wagner",
    "abholadresse": {
      "strasse": "Rathausplatz 61, Linz",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Schulstraße 78, Villach",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "4",
      "mittlereUmzugskartons": "25",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_312",
    "kundenNummer": "HUBI1312",
    "name": "Maximilian Winkler",
    "email": "maximilian.winkler@example.com",
    "phone": "+43 922484313",
    "createdAt": "2026-03-01T05:31:21.264Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian312",
    "address": {
      "street": "Rathausplatz 12",
      "city": "Linz",
      "zip": "9927",
      "country": "Österreich"
    },
    "nameLower": "maximilian winkler",
    "abholadresse": {
      "strasse": "Rathausplatz 12, Linz",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 54, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "29",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_313",
    "kundenNummer": "HUBI1313",
    "name": "Andreas Moser",
    "email": "andreas.moser@example.com",
    "phone": "+43 624283068",
    "createdAt": "2025-06-16T10:23:57.755Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas313",
    "address": {
      "street": "Rathausplatz 4",
      "city": "Innsbruck",
      "zip": "7880",
      "country": "Österreich"
    },
    "nameLower": "andreas moser",
    "abholadresse": {
      "strasse": "Rathausplatz 4, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Waldstraße 32, Wien",
      "stockwerk": "0",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_314",
    "kundenNummer": "HUBI1314",
    "name": "Lukas Berger",
    "email": "lukas.berger@example.com",
    "phone": "+43 535360929",
    "createdAt": "2025-12-01T02:56:12.183Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas314",
    "address": {
      "street": "Dorfstraße 57",
      "city": "Innsbruck",
      "zip": "4129",
      "country": "Österreich"
    },
    "nameLower": "lukas berger",
    "abholadresse": {
      "strasse": "Dorfstraße 57, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Waldstraße 14, Wels",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_315",
    "kundenNummer": "HUBI1315",
    "name": "Alexander Gruber",
    "email": "alexander.gruber@example.com",
    "phone": "+43 679909945",
    "createdAt": "2025-09-14T05:38:29.875Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander315",
    "address": {
      "street": "Hauptstraße 85",
      "city": "Salzburg",
      "zip": "5070",
      "country": "Österreich"
    },
    "nameLower": "alexander gruber",
    "abholadresse": {
      "strasse": "Hauptstraße 85, Salzburg",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 81, Wien",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "27",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_316",
    "kundenNummer": "HUBI1316",
    "name": "Laura Winkler",
    "email": "laura.winkler@example.com",
    "phone": "+43 659488490",
    "createdAt": "2025-06-04T01:53:28.550Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura316",
    "address": {
      "street": "Kirchenplatz 54",
      "city": "Graz",
      "zip": "9797",
      "country": "Österreich"
    },
    "nameLower": "laura winkler",
    "abholadresse": {
      "strasse": "Kirchenplatz 54, Graz",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Schulstraße 41, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "18",
      "mittlereUmzugskartons": "4",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_317",
    "kundenNummer": "HUBI1317",
    "name": "David Berger",
    "email": "david.berger@example.com",
    "phone": "+43 138540426",
    "createdAt": "2026-07-02T21:12:40.860Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David317",
    "address": {
      "street": "Feldgasse 56",
      "city": "Wels",
      "zip": "1923",
      "country": "Österreich"
    },
    "nameLower": "david berger",
    "abholadresse": {
      "strasse": "Feldgasse 56, Wels",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Lindenweg 44, Linz",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "21",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_318",
    "kundenNummer": "HUBI1318",
    "name": "Julia Fuchs",
    "email": "julia.fuchs@example.com",
    "phone": "+43 125689522",
    "createdAt": "2026-03-15T01:19:37.592Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia318",
    "address": {
      "street": "Schulstraße 28",
      "city": "Innsbruck",
      "zip": "9362",
      "country": "Österreich"
    },
    "nameLower": "julia fuchs",
    "abholadresse": {
      "strasse": "Schulstraße 28, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 33, Linz",
      "stockwerk": "4",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_319",
    "kundenNummer": "HUBI1319",
    "name": "Sophie Moser",
    "email": "sophie.moser@example.com",
    "phone": "+43 766243626",
    "createdAt": "2025-04-22T11:27:41.816Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie319",
    "address": {
      "street": "Schulstraße 13",
      "city": "St. Pölten",
      "zip": "7146",
      "country": "Österreich"
    },
    "nameLower": "sophie moser",
    "abholadresse": {
      "strasse": "Schulstraße 13, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 1, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "2",
      "mittlereUmzugskartons": "21",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_320",
    "kundenNummer": "HUBI1320",
    "name": "Thomas Wagner",
    "email": "thomas.wagner@example.com",
    "phone": "+43 882776967",
    "createdAt": "2025-02-03T17:23:53.890Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas320",
    "address": {
      "street": "Schulstraße 95",
      "city": "St. Pölten",
      "zip": "2551",
      "country": "Österreich"
    },
    "nameLower": "thomas wagner",
    "abholadresse": {
      "strasse": "Schulstraße 95, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 76, Graz",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "3",
      "mittlereUmzugskartons": "11",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_321",
    "kundenNummer": "HUBI1321",
    "name": "Michael Müller",
    "email": "michael.müller@example.com",
    "phone": "+43 702630312",
    "createdAt": "2025-08-25T19:43:44.985Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael321",
    "address": {
      "street": "Gartenstraße 91",
      "city": "Klagenfurt",
      "zip": "2489",
      "country": "Österreich"
    },
    "nameLower": "michael müller",
    "abholadresse": {
      "strasse": "Gartenstraße 91, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Waldstraße 56, Wien",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "6",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_322",
    "kundenNummer": "HUBI1322",
    "name": "Lukas Mayer",
    "email": "lukas.mayer@example.com",
    "phone": "+43 704667679",
    "createdAt": "2025-03-06T13:47:45.819Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas322",
    "address": {
      "street": "Wiesenweg 38",
      "city": "Linz",
      "zip": "1071",
      "country": "Österreich"
    },
    "nameLower": "lukas mayer",
    "abholadresse": {
      "strasse": "Wiesenweg 38, Linz",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 4, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "9",
      "mittlereUmzugskartons": "3",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_323",
    "kundenNummer": "HUBI1323",
    "name": "Lisa Eder",
    "email": "lisa.eder@example.com",
    "phone": "+43 615281752",
    "createdAt": "2026-06-29T22:02:23.512Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa323",
    "address": {
      "street": "Feldgasse 82",
      "city": "Innsbruck",
      "zip": "4745",
      "country": "Österreich"
    },
    "nameLower": "lisa eder",
    "abholadresse": {
      "strasse": "Feldgasse 82, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Waldstraße 20, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "13",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_324",
    "kundenNummer": "HUBI1324",
    "name": "Martin Steiner",
    "email": "martin.steiner@example.com",
    "phone": "+43 903457157",
    "createdAt": "2025-11-18T15:43:49.771Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin324",
    "address": {
      "street": "Schulstraße 21",
      "city": "Innsbruck",
      "zip": "8156",
      "country": "Österreich"
    },
    "nameLower": "martin steiner",
    "abholadresse": {
      "strasse": "Schulstraße 21, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 70, Linz",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "9",
      "mittlereUmzugskartons": "12",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_325",
    "kundenNummer": "HUBI1325",
    "name": "Alexander Steiner",
    "email": "alexander.steiner@example.com",
    "phone": "+43 109638217",
    "createdAt": "2025-01-06T02:00:09.812Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander325",
    "address": {
      "street": "Gartenstraße 60",
      "city": "St. Pölten",
      "zip": "4356",
      "country": "Österreich"
    },
    "nameLower": "alexander steiner",
    "abholadresse": {
      "strasse": "Gartenstraße 60, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 59, Wels",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_326",
    "kundenNummer": "HUBI1326",
    "name": "Sarah Moser",
    "email": "sarah.moser@example.com",
    "phone": "+43 155286802",
    "createdAt": "2025-03-01T15:02:42.661Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah326",
    "address": {
      "street": "Bergstraße 6",
      "city": "Innsbruck",
      "zip": "3319",
      "country": "Österreich"
    },
    "nameLower": "sarah moser",
    "abholadresse": {
      "strasse": "Bergstraße 6, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 51, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "3",
      "mittlereUmzugskartons": "1",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_327",
    "kundenNummer": "HUBI1327",
    "name": "Michael Pichler",
    "email": "michael.pichler@example.com",
    "phone": "+43 226568249",
    "createdAt": "2026-02-23T10:04:08.062Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael327",
    "address": {
      "street": "Waldstraße 62",
      "city": "Innsbruck",
      "zip": "5702",
      "country": "Österreich"
    },
    "nameLower": "michael pichler",
    "abholadresse": {
      "strasse": "Waldstraße 62, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 82, Wien",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_328",
    "kundenNummer": "HUBI1328",
    "name": "Maria Fischer",
    "email": "maria.fischer@example.com",
    "phone": "+43 441323996",
    "createdAt": "2025-05-25T07:55:20.728Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria328",
    "address": {
      "street": "Rathausplatz 33",
      "city": "Salzburg",
      "zip": "3378",
      "country": "Österreich"
    },
    "nameLower": "maria fischer",
    "abholadresse": {
      "strasse": "Rathausplatz 33, Salzburg",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 20, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "27",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_329",
    "kundenNummer": "HUBI1329",
    "name": "Andreas Wagner",
    "email": "andreas.wagner@example.com",
    "phone": "+43 935975093",
    "createdAt": "2026-01-06T19:18:16.298Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas329",
    "address": {
      "street": "Gartenstraße 67",
      "city": "Innsbruck",
      "zip": "7888",
      "country": "Österreich"
    },
    "nameLower": "andreas wagner",
    "abholadresse": {
      "strasse": "Gartenstraße 67, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 54, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "29",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_330",
    "kundenNummer": "HUBI1330",
    "name": "Lukas Weber",
    "email": "lukas.weber@example.com",
    "phone": "+43 384642293",
    "createdAt": "2026-03-03T16:48:50.199Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas330",
    "address": {
      "street": "Rathausplatz 9",
      "city": "Klagenfurt",
      "zip": "2117",
      "country": "Österreich"
    },
    "nameLower": "lukas weber",
    "abholadresse": {
      "strasse": "Rathausplatz 9, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bergstraße 93, Wels",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "3",
      "mittlereUmzugskartons": "1",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_331",
    "kundenNummer": "HUBI1331",
    "name": "Sarah Gruber",
    "email": "sarah.gruber@example.com",
    "phone": "+43 329318977",
    "createdAt": "2026-01-18T17:30:14.646Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah331",
    "address": {
      "street": "Bahnhofstraße 64",
      "city": "St. Pölten",
      "zip": "7059",
      "country": "Österreich"
    },
    "nameLower": "sarah gruber",
    "abholadresse": {
      "strasse": "Bahnhofstraße 64, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 73, Graz",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_332",
    "kundenNummer": "HUBI1332",
    "name": "Lisa Berger",
    "email": "lisa.berger@example.com",
    "phone": "+43 996855761",
    "createdAt": "2025-08-09T22:45:02.557Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa332",
    "address": {
      "street": "Wiesenweg 96",
      "city": "Villach",
      "zip": "6960",
      "country": "Österreich"
    },
    "nameLower": "lisa berger",
    "abholadresse": {
      "strasse": "Wiesenweg 96, Villach",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 40, Wien",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "2",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_333",
    "kundenNummer": "HUBI1333",
    "name": "Maria Weber",
    "email": "maria.weber@example.com",
    "phone": "+43 157660175",
    "createdAt": "2025-12-02T13:13:39.855Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria333",
    "address": {
      "street": "Wiesenweg 91",
      "city": "St. Pölten",
      "zip": "1414",
      "country": "Österreich"
    },
    "nameLower": "maria weber",
    "abholadresse": {
      "strasse": "Wiesenweg 91, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Waldstraße 27, Graz",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "4",
      "mittlereUmzugskartons": "23",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_334",
    "kundenNummer": "HUBI1334",
    "name": "Elena Moser",
    "email": "elena.moser@example.com",
    "phone": "+43 862997548",
    "createdAt": "2025-08-18T20:57:24.921Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena334",
    "address": {
      "street": "Schulstraße 41",
      "city": "Innsbruck",
      "zip": "5981",
      "country": "Österreich"
    },
    "nameLower": "elena moser",
    "abholadresse": {
      "strasse": "Schulstraße 41, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Schulstraße 7, Wels",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "14",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_335",
    "kundenNummer": "HUBI1335",
    "name": "Sophie Fuchs",
    "email": "sophie.fuchs@example.com",
    "phone": "+43 921991914",
    "createdAt": "2026-06-02T04:54:31.015Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie335",
    "address": {
      "street": "Feldgasse 63",
      "city": "St. Pölten",
      "zip": "9943",
      "country": "Österreich"
    },
    "nameLower": "sophie fuchs",
    "abholadresse": {
      "strasse": "Feldgasse 63, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 95, Linz",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "1",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_336",
    "kundenNummer": "HUBI1336",
    "name": "Laura Eder",
    "email": "laura.eder@example.com",
    "phone": "+43 148717583",
    "createdAt": "2025-04-30T14:37:19.733Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura336",
    "address": {
      "street": "Rathausplatz 77",
      "city": "Innsbruck",
      "zip": "1697",
      "country": "Österreich"
    },
    "nameLower": "laura eder",
    "abholadresse": {
      "strasse": "Rathausplatz 77, Innsbruck",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Waldstraße 39, Linz",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "6",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_337",
    "kundenNummer": "HUBI1337",
    "name": "Thomas Eder",
    "email": "thomas.eder@example.com",
    "phone": "+43 786891602",
    "createdAt": "2026-07-30T08:11:05.932Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas337",
    "address": {
      "street": "Gartenstraße 86",
      "city": "Dornbirn",
      "zip": "3361",
      "country": "Österreich"
    },
    "nameLower": "thomas eder",
    "abholadresse": {
      "strasse": "Gartenstraße 86, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Lindenweg 65, Linz",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "10",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_338",
    "kundenNummer": "HUBI1338",
    "name": "Andreas Hofer",
    "email": "andreas.hofer@example.com",
    "phone": "+43 928465367",
    "createdAt": "2025-05-22T11:47:45.778Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas338",
    "address": {
      "street": "Feldgasse 16",
      "city": "St. Pölten",
      "zip": "8003",
      "country": "Österreich"
    },
    "nameLower": "andreas hofer",
    "abholadresse": {
      "strasse": "Feldgasse 16, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bergstraße 75, Linz",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "15",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_339",
    "kundenNummer": "HUBI1339",
    "name": "David Hofer",
    "email": "david.hofer@example.com",
    "phone": "+43 966361257",
    "createdAt": "2026-03-26T22:57:35.200Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David339",
    "address": {
      "street": "Waldstraße 75",
      "city": "Klagenfurt",
      "zip": "3267",
      "country": "Österreich"
    },
    "nameLower": "david hofer",
    "abholadresse": {
      "strasse": "Waldstraße 75, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 88, Wels",
      "stockwerk": "0",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_340",
    "kundenNummer": "HUBI1340",
    "name": "Christian Müller",
    "email": "christian.müller@example.com",
    "phone": "+43 122662832",
    "createdAt": "2025-09-08T20:14:28.932Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian340",
    "address": {
      "street": "Wiesenweg 90",
      "city": "Klagenfurt",
      "zip": "1606",
      "country": "Österreich"
    },
    "nameLower": "christian müller",
    "abholadresse": {
      "strasse": "Wiesenweg 90, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Lindenweg 34, Linz",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "9",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_341",
    "kundenNummer": "HUBI1341",
    "name": "Lukas Koch",
    "email": "lukas.koch@example.com",
    "phone": "+43 702765653",
    "createdAt": "2025-04-26T02:20:50.318Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas341",
    "address": {
      "street": "Waldstraße 73",
      "city": "Graz",
      "zip": "9708",
      "country": "Österreich"
    },
    "nameLower": "lukas koch",
    "abholadresse": {
      "strasse": "Waldstraße 73, Graz",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bergstraße 44, Wien",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "8",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_342",
    "kundenNummer": "HUBI1342",
    "name": "Sarah Gruber",
    "email": "sarah.gruber@example.com",
    "phone": "+43 127398562",
    "createdAt": "2026-06-09T16:24:02.026Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah342",
    "address": {
      "street": "Bergstraße 20",
      "city": "St. Pölten",
      "zip": "2441",
      "country": "Österreich"
    },
    "nameLower": "sarah gruber",
    "abholadresse": {
      "strasse": "Bergstraße 20, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Lindenweg 66, Graz",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "8",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_343",
    "kundenNummer": "HUBI1343",
    "name": "Michael Fischer",
    "email": "michael.fischer@example.com",
    "phone": "+43 308341038",
    "createdAt": "2026-03-22T21:46:59.446Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael343",
    "address": {
      "street": "Hauptstraße 45",
      "city": "Wels",
      "zip": "6799",
      "country": "Österreich"
    },
    "nameLower": "michael fischer",
    "abholadresse": {
      "strasse": "Hauptstraße 45, Wels",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 10, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "29",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_344",
    "kundenNummer": "HUBI1344",
    "name": "Katharina Winkler",
    "email": "katharina.winkler@example.com",
    "phone": "+43 948383803",
    "createdAt": "2025-06-12T20:22:25.015Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina344",
    "address": {
      "street": "Lindenweg 56",
      "city": "St. Pölten",
      "zip": "9161",
      "country": "Österreich"
    },
    "nameLower": "katharina winkler",
    "abholadresse": {
      "strasse": "Lindenweg 56, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Waldstraße 26, Wels",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "4",
      "mittlereUmzugskartons": "3",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_345",
    "kundenNummer": "HUBI1345",
    "name": "Maximilian Schmidt",
    "email": "maximilian.schmidt@example.com",
    "phone": "+43 663049794",
    "createdAt": "2026-06-01T14:44:31.204Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian345",
    "address": {
      "street": "Lindenweg 97",
      "city": "Wels",
      "zip": "9799",
      "country": "Österreich"
    },
    "nameLower": "maximilian schmidt",
    "abholadresse": {
      "strasse": "Lindenweg 97, Wels",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Feldgasse 35, Linz",
      "stockwerk": "4",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_346",
    "kundenNummer": "HUBI1346",
    "name": "Anna Berger",
    "email": "anna.berger@example.com",
    "phone": "+43 127404560",
    "createdAt": "2026-07-12T09:35:24.403Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna346",
    "address": {
      "street": "Wiesenweg 18",
      "city": "Villach",
      "zip": "6472",
      "country": "Österreich"
    },
    "nameLower": "anna berger",
    "abholadresse": {
      "strasse": "Wiesenweg 18, Villach",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 39, Salzburg",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "24",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_347",
    "kundenNummer": "HUBI1347",
    "name": "Katharina Fischer",
    "email": "katharina.fischer@example.com",
    "phone": "+43 451931383",
    "createdAt": "2025-12-06T11:58:54.462Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina347",
    "address": {
      "street": "Rathausplatz 67",
      "city": "Wien",
      "zip": "9548",
      "country": "Österreich"
    },
    "nameLower": "katharina fischer",
    "abholadresse": {
      "strasse": "Rathausplatz 67, Wien",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 45, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "25",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_348",
    "kundenNummer": "HUBI1348",
    "name": "Christian Winkler",
    "email": "christian.winkler@example.com",
    "phone": "+43 798953432",
    "createdAt": "2025-10-01T17:41:28.692Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian348",
    "address": {
      "street": "Waldstraße 21",
      "city": "Klagenfurt",
      "zip": "2291",
      "country": "Österreich"
    },
    "nameLower": "christian winkler",
    "abholadresse": {
      "strasse": "Waldstraße 21, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 81, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_349",
    "kundenNummer": "HUBI1349",
    "name": "Katharina Eder",
    "email": "katharina.eder@example.com",
    "phone": "+43 998372607",
    "createdAt": "2025-01-15T02:52:07.175Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina349",
    "address": {
      "street": "Schulstraße 35",
      "city": "Wien",
      "zip": "6388",
      "country": "Österreich"
    },
    "nameLower": "katharina eder",
    "abholadresse": {
      "strasse": "Schulstraße 35, Wien",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Waldstraße 94, Wels",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "17",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_350",
    "kundenNummer": "HUBI1350",
    "name": "Christian Koch",
    "email": "christian.koch@example.com",
    "phone": "+43 777839670",
    "createdAt": "2026-07-30T17:29:33.999Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian350",
    "address": {
      "street": "Hauptstraße 74",
      "city": "Dornbirn",
      "zip": "4880",
      "country": "Österreich"
    },
    "nameLower": "christian koch",
    "abholadresse": {
      "strasse": "Hauptstraße 74, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 50, Graz",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "5",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_351",
    "kundenNummer": "HUBI1351",
    "name": "Christina Fischer",
    "email": "christina.fischer@example.com",
    "phone": "+43 423713514",
    "createdAt": "2025-02-25T01:20:30.075Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina351",
    "address": {
      "street": "Dorfstraße 19",
      "city": "Linz",
      "zip": "1291",
      "country": "Österreich"
    },
    "nameLower": "christina fischer",
    "abholadresse": {
      "strasse": "Dorfstraße 19, Linz",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 65, Salzburg",
      "stockwerk": "0",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_352",
    "kundenNummer": "HUBI1352",
    "name": "Alexander Reiter",
    "email": "alexander.reiter@example.com",
    "phone": "+43 133818558",
    "createdAt": "2025-09-20T06:28:03.280Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander352",
    "address": {
      "street": "Hauptstraße 3",
      "city": "Graz",
      "zip": "4754",
      "country": "Österreich"
    },
    "nameLower": "alexander reiter",
    "abholadresse": {
      "strasse": "Hauptstraße 3, Graz",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Feldgasse 26, Wels",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "27",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_353",
    "kundenNummer": "HUBI1353",
    "name": "Christian Steiner",
    "email": "christian.steiner@example.com",
    "phone": "+43 562868392",
    "createdAt": "2026-07-27T23:32:40.325Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian353",
    "address": {
      "street": "Dorfstraße 9",
      "city": "Villach",
      "zip": "4327",
      "country": "Österreich"
    },
    "nameLower": "christian steiner",
    "abholadresse": {
      "strasse": "Dorfstraße 9, Villach",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 56, Villach",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "21",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_354",
    "kundenNummer": "HUBI1354",
    "name": "Laura Wagner",
    "email": "laura.wagner@example.com",
    "phone": "+43 892432432",
    "createdAt": "2025-12-07T21:36:15.573Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura354",
    "address": {
      "street": "Kirchenplatz 83",
      "city": "St. Pölten",
      "zip": "4151",
      "country": "Österreich"
    },
    "nameLower": "laura wagner",
    "abholadresse": {
      "strasse": "Kirchenplatz 83, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Feldgasse 90, Linz",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "1",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_355",
    "kundenNummer": "HUBI1355",
    "name": "Stefan Berger",
    "email": "stefan.berger@example.com",
    "phone": "+43 837494491",
    "createdAt": "2025-08-11T08:32:51.070Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan355",
    "address": {
      "street": "Kirchenplatz 87",
      "city": "St. Pölten",
      "zip": "1842",
      "country": "Österreich"
    },
    "nameLower": "stefan berger",
    "abholadresse": {
      "strasse": "Kirchenplatz 87, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 17, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_356",
    "kundenNummer": "HUBI1356",
    "name": "Christian Mayer",
    "email": "christian.mayer@example.com",
    "phone": "+43 629942726",
    "createdAt": "2026-04-08T08:43:54.386Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian356",
    "address": {
      "street": "Feldgasse 13",
      "city": "St. Pölten",
      "zip": "1120",
      "country": "Österreich"
    },
    "nameLower": "christian mayer",
    "abholadresse": {
      "strasse": "Feldgasse 13, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 27, Villach",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "2",
      "mittlereUmzugskartons": "20",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_357",
    "kundenNummer": "HUBI1357",
    "name": "Katharina Steiner",
    "email": "katharina.steiner@example.com",
    "phone": "+43 639345274",
    "createdAt": "2025-09-24T05:43:18.094Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina357",
    "address": {
      "street": "Hauptstraße 35",
      "city": "Innsbruck",
      "zip": "2515",
      "country": "Österreich"
    },
    "nameLower": "katharina steiner",
    "abholadresse": {
      "strasse": "Hauptstraße 35, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 79, Wien",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "9",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_358",
    "kundenNummer": "HUBI1358",
    "name": "Katharina Berger",
    "email": "katharina.berger@example.com",
    "phone": "+43 525585648",
    "createdAt": "2026-04-12T10:25:36.764Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina358",
    "address": {
      "street": "Waldstraße 83",
      "city": "Wien",
      "zip": "4185",
      "country": "Österreich"
    },
    "nameLower": "katharina berger",
    "abholadresse": {
      "strasse": "Waldstraße 83, Wien",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 64, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "5",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_359",
    "kundenNummer": "HUBI1359",
    "name": "Elena Winkler",
    "email": "elena.winkler@example.com",
    "phone": "+43 617625071",
    "createdAt": "2026-04-27T22:11:15.122Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena359",
    "address": {
      "street": "Waldstraße 65",
      "city": "Wien",
      "zip": "4685",
      "country": "Österreich"
    },
    "nameLower": "elena winkler",
    "abholadresse": {
      "strasse": "Waldstraße 65, Wien",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Schulstraße 50, Graz",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "17",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_360",
    "kundenNummer": "HUBI1360",
    "name": "Sarah Reiter",
    "email": "sarah.reiter@example.com",
    "phone": "+43 621035923",
    "createdAt": "2025-05-03T03:09:54.123Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah360",
    "address": {
      "street": "Kirchenplatz 0",
      "city": "Villach",
      "zip": "6089",
      "country": "Österreich"
    },
    "nameLower": "sarah reiter",
    "abholadresse": {
      "strasse": "Kirchenplatz 0, Villach",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Feldgasse 86, Linz",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "24",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_361",
    "kundenNummer": "HUBI1361",
    "name": "Christian Pichler",
    "email": "christian.pichler@example.com",
    "phone": "+43 209284212",
    "createdAt": "2025-08-29T02:03:51.237Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian361",
    "address": {
      "street": "Bahnhofstraße 63",
      "city": "Innsbruck",
      "zip": "5411",
      "country": "Österreich"
    },
    "nameLower": "christian pichler",
    "abholadresse": {
      "strasse": "Bahnhofstraße 63, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bergstraße 37, Wien",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "1",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_362",
    "kundenNummer": "HUBI1362",
    "name": "Christina Huber",
    "email": "christina.huber@example.com",
    "phone": "+43 512809346",
    "createdAt": "2026-03-14T12:38:41.542Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina362",
    "address": {
      "street": "Bahnhofstraße 79",
      "city": "Linz",
      "zip": "6759",
      "country": "Österreich"
    },
    "nameLower": "christina huber",
    "abholadresse": {
      "strasse": "Bahnhofstraße 79, Linz",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Feldgasse 6, Wien",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "7",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_363",
    "kundenNummer": "HUBI1363",
    "name": "Laura Reiter",
    "email": "laura.reiter@example.com",
    "phone": "+43 501683234",
    "createdAt": "2026-01-13T20:34:59.720Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura363",
    "address": {
      "street": "Waldstraße 89",
      "city": "Wels",
      "zip": "3309",
      "country": "Österreich"
    },
    "nameLower": "laura reiter",
    "abholadresse": {
      "strasse": "Waldstraße 89, Wels",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 36, Wien",
      "stockwerk": "0",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_364",
    "kundenNummer": "HUBI1364",
    "name": "Elena Weber",
    "email": "elena.weber@example.com",
    "phone": "+43 598349593",
    "createdAt": "2025-03-30T23:32:24.167Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena364",
    "address": {
      "street": "Bahnhofstraße 34",
      "city": "Wels",
      "zip": "7416",
      "country": "Österreich"
    },
    "nameLower": "elena weber",
    "abholadresse": {
      "strasse": "Bahnhofstraße 34, Wels",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 72, Villach",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "4",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_365",
    "kundenNummer": "HUBI1365",
    "name": "Andreas Eder",
    "email": "andreas.eder@example.com",
    "phone": "+43 938956979",
    "createdAt": "2025-04-05T00:44:41.628Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas365",
    "address": {
      "street": "Lindenweg 68",
      "city": "Linz",
      "zip": "1595",
      "country": "Österreich"
    },
    "nameLower": "andreas eder",
    "abholadresse": {
      "strasse": "Lindenweg 68, Linz",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Waldstraße 65, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "12",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_366",
    "kundenNummer": "HUBI1366",
    "name": "David Bauer",
    "email": "david.bauer@example.com",
    "phone": "+43 808903015",
    "createdAt": "2025-06-18T14:36:23.062Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David366",
    "address": {
      "street": "Hauptstraße 69",
      "city": "Villach",
      "zip": "8968",
      "country": "Österreich"
    },
    "nameLower": "david bauer",
    "abholadresse": {
      "strasse": "Hauptstraße 69, Villach",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 62, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "20",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_367",
    "kundenNummer": "HUBI1367",
    "name": "Andreas Mayer",
    "email": "andreas.mayer@example.com",
    "phone": "+43 594452037",
    "createdAt": "2026-03-13T18:44:22.814Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas367",
    "address": {
      "street": "Wiesenweg 93",
      "city": "Graz",
      "zip": "8419",
      "country": "Österreich"
    },
    "nameLower": "andreas mayer",
    "abholadresse": {
      "strasse": "Wiesenweg 93, Graz",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 92, Wien",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "18",
      "mittlereUmzugskartons": "21",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_368",
    "kundenNummer": "HUBI1368",
    "name": "Lukas Huber",
    "email": "lukas.huber@example.com",
    "phone": "+43 533260750",
    "createdAt": "2026-04-05T23:44:12.490Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas368",
    "address": {
      "street": "Gartenstraße 41",
      "city": "Linz",
      "zip": "6886",
      "country": "Österreich"
    },
    "nameLower": "lukas huber",
    "abholadresse": {
      "strasse": "Gartenstraße 41, Linz",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Feldgasse 3, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "0",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_369",
    "kundenNummer": "HUBI1369",
    "name": "Christian Schmidt",
    "email": "christian.schmidt@example.com",
    "phone": "+43 385029586",
    "createdAt": "2025-05-30T04:10:23.710Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian369",
    "address": {
      "street": "Waldstraße 94",
      "city": "Wels",
      "zip": "8665",
      "country": "Österreich"
    },
    "nameLower": "christian schmidt",
    "abholadresse": {
      "strasse": "Waldstraße 94, Wels",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 1, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "9",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_370",
    "kundenNummer": "HUBI1370",
    "name": "Sophie Moser",
    "email": "sophie.moser@example.com",
    "phone": "+43 916951446",
    "createdAt": "2026-04-08T16:11:36.221Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie370",
    "address": {
      "street": "Schulstraße 10",
      "city": "Klagenfurt",
      "zip": "5131",
      "country": "Österreich"
    },
    "nameLower": "sophie moser",
    "abholadresse": {
      "strasse": "Schulstraße 10, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 57, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_371",
    "kundenNummer": "HUBI1371",
    "name": "Anna Moser",
    "email": "anna.moser@example.com",
    "phone": "+43 512290394",
    "createdAt": "2026-01-26T10:02:20.167Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna371",
    "address": {
      "street": "Bergstraße 1",
      "city": "Wien",
      "zip": "1961",
      "country": "Österreich"
    },
    "nameLower": "anna moser",
    "abholadresse": {
      "strasse": "Bergstraße 1, Wien",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 3, Wels",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "20",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_372",
    "kundenNummer": "HUBI1372",
    "name": "Maximilian Steiner",
    "email": "maximilian.steiner@example.com",
    "phone": "+43 784749710",
    "createdAt": "2025-10-29T10:25:45.223Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian372",
    "address": {
      "street": "Bergstraße 46",
      "city": "Klagenfurt",
      "zip": "4048",
      "country": "Österreich"
    },
    "nameLower": "maximilian steiner",
    "abholadresse": {
      "strasse": "Bergstraße 46, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 78, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_373",
    "kundenNummer": "HUBI1373",
    "name": "Katharina Müller",
    "email": "katharina.müller@example.com",
    "phone": "+43 589693412",
    "createdAt": "2025-07-22T07:24:39.278Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina373",
    "address": {
      "street": "Bergstraße 12",
      "city": "Wien",
      "zip": "5237",
      "country": "Österreich"
    },
    "nameLower": "katharina müller",
    "abholadresse": {
      "strasse": "Bergstraße 12, Wien",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Waldstraße 26, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "13",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_374",
    "kundenNummer": "HUBI1374",
    "name": "Sarah Winkler",
    "email": "sarah.winkler@example.com",
    "phone": "+43 889812110",
    "createdAt": "2025-04-03T04:41:09.038Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah374",
    "address": {
      "street": "Lindenweg 53",
      "city": "Villach",
      "zip": "9887",
      "country": "Österreich"
    },
    "nameLower": "sarah winkler",
    "abholadresse": {
      "strasse": "Lindenweg 53, Villach",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bergstraße 27, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_375",
    "kundenNummer": "HUBI1375",
    "name": "Stefan Müller",
    "email": "stefan.müller@example.com",
    "phone": "+43 896841010",
    "createdAt": "2025-05-24T17:35:41.018Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan375",
    "address": {
      "street": "Schulstraße 72",
      "city": "Graz",
      "zip": "1807",
      "country": "Österreich"
    },
    "nameLower": "stefan müller",
    "abholadresse": {
      "strasse": "Schulstraße 72, Graz",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 45, Salzburg",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "9",
      "mittlereUmzugskartons": "8",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_376",
    "kundenNummer": "HUBI1376",
    "name": "Maximilian Wagner",
    "email": "maximilian.wagner@example.com",
    "phone": "+43 928546058",
    "createdAt": "2025-06-09T20:01:31.263Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian376",
    "address": {
      "street": "Hauptstraße 38",
      "city": "Wien",
      "zip": "5776",
      "country": "Österreich"
    },
    "nameLower": "maximilian wagner",
    "abholadresse": {
      "strasse": "Hauptstraße 38, Wien",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Waldstraße 73, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_377",
    "kundenNummer": "HUBI1377",
    "name": "Sophie Pichler",
    "email": "sophie.pichler@example.com",
    "phone": "+43 262009140",
    "createdAt": "2025-08-16T22:48:29.598Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie377",
    "address": {
      "street": "Waldstraße 47",
      "city": "Wien",
      "zip": "1365",
      "country": "Österreich"
    },
    "nameLower": "sophie pichler",
    "abholadresse": {
      "strasse": "Waldstraße 47, Wien",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 32, Innsbruck",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "19",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_378",
    "kundenNummer": "HUBI1378",
    "name": "Andreas Hofer",
    "email": "andreas.hofer@example.com",
    "phone": "+43 824875408",
    "createdAt": "2025-09-14T18:06:57.336Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas378",
    "address": {
      "street": "Bergstraße 10",
      "city": "Innsbruck",
      "zip": "1225",
      "country": "Österreich"
    },
    "nameLower": "andreas hofer",
    "abholadresse": {
      "strasse": "Bergstraße 10, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 30, Linz",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "12",
      "mittlereUmzugskartons": "21",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_379",
    "kundenNummer": "HUBI1379",
    "name": "Julia Schmidt",
    "email": "julia.schmidt@example.com",
    "phone": "+43 742898069",
    "createdAt": "2026-03-02T13:23:43.734Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia379",
    "address": {
      "street": "Kirchenplatz 88",
      "city": "Klagenfurt",
      "zip": "9197",
      "country": "Österreich"
    },
    "nameLower": "julia schmidt",
    "abholadresse": {
      "strasse": "Kirchenplatz 88, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Lindenweg 34, Linz",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "2",
      "mittlereUmzugskartons": "25",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_380",
    "kundenNummer": "HUBI1380",
    "name": "Lisa Berger",
    "email": "lisa.berger@example.com",
    "phone": "+43 705039685",
    "createdAt": "2026-01-02T06:48:03.901Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa380",
    "address": {
      "street": "Hauptstraße 10",
      "city": "Wels",
      "zip": "1321",
      "country": "Österreich"
    },
    "nameLower": "lisa berger",
    "abholadresse": {
      "strasse": "Hauptstraße 10, Wels",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 83, Graz",
      "stockwerk": "0",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_381",
    "kundenNummer": "HUBI1381",
    "name": "Maria Winkler",
    "email": "maria.winkler@example.com",
    "phone": "+43 958465094",
    "createdAt": "2026-04-14T02:51:57.513Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria381",
    "address": {
      "street": "Lindenweg 90",
      "city": "Klagenfurt",
      "zip": "8150",
      "country": "Österreich"
    },
    "nameLower": "maria winkler",
    "abholadresse": {
      "strasse": "Lindenweg 90, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 70, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_382",
    "kundenNummer": "HUBI1382",
    "name": "Martin Steiner",
    "email": "martin.steiner@example.com",
    "phone": "+43 840156913",
    "createdAt": "2025-02-04T04:29:55.485Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin382",
    "address": {
      "street": "Wiesenweg 38",
      "city": "Klagenfurt",
      "zip": "2649",
      "country": "Österreich"
    },
    "nameLower": "martin steiner",
    "abholadresse": {
      "strasse": "Wiesenweg 38, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Feldgasse 19, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "9",
      "mittlereUmzugskartons": "17",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_383",
    "kundenNummer": "HUBI1383",
    "name": "Michael Hofer",
    "email": "michael.hofer@example.com",
    "phone": "+43 937832787",
    "createdAt": "2025-11-06T07:07:00.050Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael383",
    "address": {
      "street": "Schulstraße 52",
      "city": "Linz",
      "zip": "4285",
      "country": "Österreich"
    },
    "nameLower": "michael hofer",
    "abholadresse": {
      "strasse": "Schulstraße 52, Linz",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 39, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "4",
      "mittlereUmzugskartons": "3",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_384",
    "kundenNummer": "HUBI1384",
    "name": "Thomas Steiner",
    "email": "thomas.steiner@example.com",
    "phone": "+43 544223389",
    "createdAt": "2025-06-03T23:42:45.047Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas384",
    "address": {
      "street": "Gartenstraße 88",
      "city": "Salzburg",
      "zip": "9865",
      "country": "Österreich"
    },
    "nameLower": "thomas steiner",
    "abholadresse": {
      "strasse": "Gartenstraße 88, Salzburg",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 7, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "3",
      "mittlereUmzugskartons": "15",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_385",
    "kundenNummer": "HUBI1385",
    "name": "Lukas Fischer",
    "email": "lukas.fischer@example.com",
    "phone": "+43 803332561",
    "createdAt": "2025-11-28T13:47:07.667Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas385",
    "address": {
      "street": "Rathausplatz 67",
      "city": "Salzburg",
      "zip": "1717",
      "country": "Österreich"
    },
    "nameLower": "lukas fischer",
    "abholadresse": {
      "strasse": "Rathausplatz 67, Salzburg",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 42, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "28",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_386",
    "kundenNummer": "HUBI1386",
    "name": "Laura Schmid",
    "email": "laura.schmid@example.com",
    "phone": "+43 201553528",
    "createdAt": "2025-05-24T06:54:05.792Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura386",
    "address": {
      "street": "Hauptstraße 3",
      "city": "Graz",
      "zip": "7302",
      "country": "Österreich"
    },
    "nameLower": "laura schmid",
    "abholadresse": {
      "strasse": "Hauptstraße 3, Graz",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 36, Wien",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "6",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_387",
    "kundenNummer": "HUBI1387",
    "name": "Katharina Fuchs",
    "email": "katharina.fuchs@example.com",
    "phone": "+43 837514874",
    "createdAt": "2025-02-21T11:43:09.811Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina387",
    "address": {
      "street": "Lindenweg 15",
      "city": "Linz",
      "zip": "3125",
      "country": "Österreich"
    },
    "nameLower": "katharina fuchs",
    "abholadresse": {
      "strasse": "Lindenweg 15, Linz",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 46, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_388",
    "kundenNummer": "HUBI1388",
    "name": "Christina Reiter",
    "email": "christina.reiter@example.com",
    "phone": "+43 647810853",
    "createdAt": "2025-08-08T22:18:23.925Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina388",
    "address": {
      "street": "Waldstraße 3",
      "city": "Dornbirn",
      "zip": "7579",
      "country": "Österreich"
    },
    "nameLower": "christina reiter",
    "abholadresse": {
      "strasse": "Waldstraße 3, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 33, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "28",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_389",
    "kundenNummer": "HUBI1389",
    "name": "Alexander Steiner",
    "email": "alexander.steiner@example.com",
    "phone": "+43 164530662",
    "createdAt": "2025-07-12T10:24:01.210Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander389",
    "address": {
      "street": "Bergstraße 67",
      "city": "Salzburg",
      "zip": "2012",
      "country": "Österreich"
    },
    "nameLower": "alexander steiner",
    "abholadresse": {
      "strasse": "Bergstraße 67, Salzburg",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bergstraße 50, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "23",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_390",
    "kundenNummer": "HUBI1390",
    "name": "Thomas Winkler",
    "email": "thomas.winkler@example.com",
    "phone": "+43 657807467",
    "createdAt": "2026-03-27T22:04:00.929Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas390",
    "address": {
      "street": "Rathausplatz 80",
      "city": "Villach",
      "zip": "7005",
      "country": "Österreich"
    },
    "nameLower": "thomas winkler",
    "abholadresse": {
      "strasse": "Rathausplatz 80, Villach",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bergstraße 24, Villach",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_391",
    "kundenNummer": "HUBI1391",
    "name": "Christian Koch",
    "email": "christian.koch@example.com",
    "phone": "+43 509130078",
    "createdAt": "2025-10-12T07:07:21.223Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian391",
    "address": {
      "street": "Kirchenplatz 3",
      "city": "Klagenfurt",
      "zip": "7973",
      "country": "Österreich"
    },
    "nameLower": "christian koch",
    "abholadresse": {
      "strasse": "Kirchenplatz 3, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Feldgasse 29, Villach",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_392",
    "kundenNummer": "HUBI1392",
    "name": "Maximilian Hofer",
    "email": "maximilian.hofer@example.com",
    "phone": "+43 776620139",
    "createdAt": "2025-03-24T22:36:53.808Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian392",
    "address": {
      "street": "Rathausplatz 16",
      "city": "Wels",
      "zip": "7829",
      "country": "Österreich"
    },
    "nameLower": "maximilian hofer",
    "abholadresse": {
      "strasse": "Rathausplatz 16, Wels",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 18, Salzburg",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "3",
      "mittlereUmzugskartons": "0",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_393",
    "kundenNummer": "HUBI1393",
    "name": "Andreas Steiner",
    "email": "andreas.steiner@example.com",
    "phone": "+43 217198233",
    "createdAt": "2025-09-21T14:55:04.820Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas393",
    "address": {
      "street": "Feldgasse 68",
      "city": "Klagenfurt",
      "zip": "3562",
      "country": "Österreich"
    },
    "nameLower": "andreas steiner",
    "abholadresse": {
      "strasse": "Feldgasse 68, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Lindenweg 16, Wien",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "9",
      "mittlereUmzugskartons": "22",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_394",
    "kundenNummer": "HUBI1394",
    "name": "David Bauer",
    "email": "david.bauer@example.com",
    "phone": "+43 969397729",
    "createdAt": "2025-07-05T17:32:31.966Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David394",
    "address": {
      "street": "Hauptstraße 93",
      "city": "Innsbruck",
      "zip": "9108",
      "country": "Österreich"
    },
    "nameLower": "david bauer",
    "abholadresse": {
      "strasse": "Hauptstraße 93, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Lindenweg 45, Villach",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "14",
      "mittlereUmzugskartons": "25",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_395",
    "kundenNummer": "HUBI1395",
    "name": "Lisa Mayer",
    "email": "lisa.mayer@example.com",
    "phone": "+43 916267489",
    "createdAt": "2026-03-22T03:24:35.324Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa395",
    "address": {
      "street": "Kirchenplatz 44",
      "city": "Villach",
      "zip": "3664",
      "country": "Österreich"
    },
    "nameLower": "lisa mayer",
    "abholadresse": {
      "strasse": "Kirchenplatz 44, Villach",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 40, Linz",
      "stockwerk": "1",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_396",
    "kundenNummer": "HUBI1396",
    "name": "Thomas Berger",
    "email": "thomas.berger@example.com",
    "phone": "+43 993388055",
    "createdAt": "2025-03-07T11:20:57.052Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas396",
    "address": {
      "street": "Hauptstraße 12",
      "city": "Innsbruck",
      "zip": "6272",
      "country": "Österreich"
    },
    "nameLower": "thomas berger",
    "abholadresse": {
      "strasse": "Hauptstraße 12, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 77, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "17",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_397",
    "kundenNummer": "HUBI1397",
    "name": "Sophie Berger",
    "email": "sophie.berger@example.com",
    "phone": "+43 270872923",
    "createdAt": "2026-07-27T02:59:52.260Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie397",
    "address": {
      "street": "Dorfstraße 67",
      "city": "Wels",
      "zip": "8308",
      "country": "Österreich"
    },
    "nameLower": "sophie berger",
    "abholadresse": {
      "strasse": "Dorfstraße 67, Wels",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 75, Linz",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "8",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_398",
    "kundenNummer": "HUBI1398",
    "name": "Martin Steiner",
    "email": "martin.steiner@example.com",
    "phone": "+43 822860205",
    "createdAt": "2026-06-19T17:12:28.948Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin398",
    "address": {
      "street": "Gartenstraße 52",
      "city": "Wien",
      "zip": "1565",
      "country": "Österreich"
    },
    "nameLower": "martin steiner",
    "abholadresse": {
      "strasse": "Gartenstraße 52, Wien",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 52, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "29",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_399",
    "kundenNummer": "HUBI1399",
    "name": "Katharina Fischer",
    "email": "katharina.fischer@example.com",
    "phone": "+43 723135461",
    "createdAt": "2026-07-15T06:37:46.466Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina399",
    "address": {
      "street": "Feldgasse 90",
      "city": "Innsbruck",
      "zip": "2962",
      "country": "Österreich"
    },
    "nameLower": "katharina fischer",
    "abholadresse": {
      "strasse": "Feldgasse 90, Innsbruck",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 85, Wien",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "14",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_400",
    "kundenNummer": "HUBI1400",
    "name": "Andreas Mayer",
    "email": "andreas.mayer@example.com",
    "phone": "+43 463258729",
    "createdAt": "2025-06-29T01:33:21.747Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas400",
    "address": {
      "street": "Kirchenplatz 63",
      "city": "Wels",
      "zip": "6292",
      "country": "Österreich"
    },
    "nameLower": "andreas mayer",
    "abholadresse": {
      "strasse": "Kirchenplatz 63, Wels",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 83, Graz",
      "stockwerk": "2",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_401",
    "kundenNummer": "HUBI1401",
    "name": "Elena Steiner",
    "email": "elena.steiner@example.com",
    "phone": "+43 319735633",
    "createdAt": "2025-09-16T12:25:39.138Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena401",
    "address": {
      "street": "Dorfstraße 56",
      "city": "Linz",
      "zip": "1902",
      "country": "Österreich"
    },
    "nameLower": "elena steiner",
    "abholadresse": {
      "strasse": "Dorfstraße 56, Linz",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Feldgasse 20, Villach",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "17",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_402",
    "kundenNummer": "HUBI1402",
    "name": "Anna Steiner",
    "email": "anna.steiner@example.com",
    "phone": "+43 648207887",
    "createdAt": "2026-01-13T10:41:32.496Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna402",
    "address": {
      "street": "Schulstraße 51",
      "city": "Linz",
      "zip": "4156",
      "country": "Österreich"
    },
    "nameLower": "anna steiner",
    "abholadresse": {
      "strasse": "Schulstraße 51, Linz",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Schulstraße 2, Linz",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "9",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_403",
    "kundenNummer": "HUBI1403",
    "name": "Stefan Winkler",
    "email": "stefan.winkler@example.com",
    "phone": "+43 985413315",
    "createdAt": "2025-08-24T14:35:30.233Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan403",
    "address": {
      "street": "Kirchenplatz 79",
      "city": "St. Pölten",
      "zip": "7011",
      "country": "Österreich"
    },
    "nameLower": "stefan winkler",
    "abholadresse": {
      "strasse": "Kirchenplatz 79, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 11, Graz",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_404",
    "kundenNummer": "HUBI1404",
    "name": "Thomas Koch",
    "email": "thomas.koch@example.com",
    "phone": "+43 776678173",
    "createdAt": "2025-08-15T08:24:55.806Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas404",
    "address": {
      "street": "Gartenstraße 64",
      "city": "Villach",
      "zip": "9992",
      "country": "Österreich"
    },
    "nameLower": "thomas koch",
    "abholadresse": {
      "strasse": "Gartenstraße 64, Villach",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 35, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "2",
      "mittlereUmzugskartons": "6",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_405",
    "kundenNummer": "HUBI1405",
    "name": "Sophie Gruber",
    "email": "sophie.gruber@example.com",
    "phone": "+43 179230688",
    "createdAt": "2026-04-30T23:24:41.699Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie405",
    "address": {
      "street": "Dorfstraße 92",
      "city": "St. Pölten",
      "zip": "3311",
      "country": "Österreich"
    },
    "nameLower": "sophie gruber",
    "abholadresse": {
      "strasse": "Dorfstraße 92, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Schulstraße 85, Wien",
      "stockwerk": "2",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_406",
    "kundenNummer": "HUBI1406",
    "name": "Christina Berger",
    "email": "christina.berger@example.com",
    "phone": "+43 214967810",
    "createdAt": "2025-10-01T12:33:13.393Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina406",
    "address": {
      "street": "Waldstraße 12",
      "city": "Klagenfurt",
      "zip": "7679",
      "country": "Österreich"
    },
    "nameLower": "christina berger",
    "abholadresse": {
      "strasse": "Waldstraße 12, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 68, Villach",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "2",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_407",
    "kundenNummer": "HUBI1407",
    "name": "Lukas Weber",
    "email": "lukas.weber@example.com",
    "phone": "+43 312294138",
    "createdAt": "2025-09-29T06:57:02.875Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas407",
    "address": {
      "street": "Feldgasse 74",
      "city": "Salzburg",
      "zip": "4132",
      "country": "Österreich"
    },
    "nameLower": "lukas weber",
    "abholadresse": {
      "strasse": "Feldgasse 74, Salzburg",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 63, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_408",
    "kundenNummer": "HUBI1408",
    "name": "Michael Wagner",
    "email": "michael.wagner@example.com",
    "phone": "+43 307760182",
    "createdAt": "2025-10-08T21:54:15.523Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael408",
    "address": {
      "street": "Hauptstraße 46",
      "city": "Villach",
      "zip": "5162",
      "country": "Österreich"
    },
    "nameLower": "michael wagner",
    "abholadresse": {
      "strasse": "Hauptstraße 46, Villach",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 8, Innsbruck",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "22",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_409",
    "kundenNummer": "HUBI1409",
    "name": "Lisa Schmid",
    "email": "lisa.schmid@example.com",
    "phone": "+43 306020556",
    "createdAt": "2025-09-25T14:51:37.246Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa409",
    "address": {
      "street": "Lindenweg 5",
      "city": "St. Pölten",
      "zip": "2666",
      "country": "Österreich"
    },
    "nameLower": "lisa schmid",
    "abholadresse": {
      "strasse": "Lindenweg 5, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 66, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "20",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_410",
    "kundenNummer": "HUBI1410",
    "name": "Christina Fuchs",
    "email": "christina.fuchs@example.com",
    "phone": "+43 477255913",
    "createdAt": "2025-10-02T05:38:03.883Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina410",
    "address": {
      "street": "Feldgasse 33",
      "city": "Salzburg",
      "zip": "7720",
      "country": "Österreich"
    },
    "nameLower": "christina fuchs",
    "abholadresse": {
      "strasse": "Feldgasse 33, Salzburg",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 78, Innsbruck",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "9",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_411",
    "kundenNummer": "HUBI1411",
    "name": "Sophie Berger",
    "email": "sophie.berger@example.com",
    "phone": "+43 857904745",
    "createdAt": "2025-09-03T04:59:37.330Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie411",
    "address": {
      "street": "Bahnhofstraße 34",
      "city": "Graz",
      "zip": "2118",
      "country": "Österreich"
    },
    "nameLower": "sophie berger",
    "abholadresse": {
      "strasse": "Bahnhofstraße 34, Graz",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Waldstraße 28, Wels",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "23",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_412",
    "kundenNummer": "HUBI1412",
    "name": "Stefan Weber",
    "email": "stefan.weber@example.com",
    "phone": "+43 612099228",
    "createdAt": "2025-12-18T22:50:19.327Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan412",
    "address": {
      "street": "Kirchenplatz 92",
      "city": "Klagenfurt",
      "zip": "8271",
      "country": "Österreich"
    },
    "nameLower": "stefan weber",
    "abholadresse": {
      "strasse": "Kirchenplatz 92, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Feldgasse 81, Linz",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "21",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_413",
    "kundenNummer": "HUBI1413",
    "name": "Maximilian Gruber",
    "email": "maximilian.gruber@example.com",
    "phone": "+43 288899883",
    "createdAt": "2026-01-11T02:04:05.449Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian413",
    "address": {
      "street": "Lindenweg 64",
      "city": "Klagenfurt",
      "zip": "3460",
      "country": "Österreich"
    },
    "nameLower": "maximilian gruber",
    "abholadresse": {
      "strasse": "Lindenweg 64, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Schulstraße 97, Linz",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_414",
    "kundenNummer": "HUBI1414",
    "name": "Maximilian Wagner",
    "email": "maximilian.wagner@example.com",
    "phone": "+43 164639151",
    "createdAt": "2026-01-02T22:52:19.232Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian414",
    "address": {
      "street": "Schulstraße 66",
      "city": "Wels",
      "zip": "6422",
      "country": "Österreich"
    },
    "nameLower": "maximilian wagner",
    "abholadresse": {
      "strasse": "Schulstraße 66, Wels",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 72, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "24",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_415",
    "kundenNummer": "HUBI1415",
    "name": "Michael Weber",
    "email": "michael.weber@example.com",
    "phone": "+43 978523832",
    "createdAt": "2026-05-30T17:46:32.859Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael415",
    "address": {
      "street": "Dorfstraße 97",
      "city": "Graz",
      "zip": "5082",
      "country": "Österreich"
    },
    "nameLower": "michael weber",
    "abholadresse": {
      "strasse": "Dorfstraße 97, Graz",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Waldstraße 79, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "15",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_416",
    "kundenNummer": "HUBI1416",
    "name": "David Wagner",
    "email": "david.wagner@example.com",
    "phone": "+43 351623728",
    "createdAt": "2025-09-09T06:32:50.519Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David416",
    "address": {
      "street": "Bergstraße 66",
      "city": "St. Pölten",
      "zip": "5396",
      "country": "Österreich"
    },
    "nameLower": "david wagner",
    "abholadresse": {
      "strasse": "Bergstraße 66, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Waldstraße 80, Graz",
      "stockwerk": "3",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_417",
    "kundenNummer": "HUBI1417",
    "name": "Christina Winkler",
    "email": "christina.winkler@example.com",
    "phone": "+43 851459324",
    "createdAt": "2026-02-22T00:46:25.438Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina417",
    "address": {
      "street": "Bergstraße 14",
      "city": "Wien",
      "zip": "3058",
      "country": "Österreich"
    },
    "nameLower": "christina winkler",
    "abholadresse": {
      "strasse": "Bergstraße 14, Wien",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 1, Villach",
      "stockwerk": "3",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_418",
    "kundenNummer": "HUBI1418",
    "name": "Michael Winkler",
    "email": "michael.winkler@example.com",
    "phone": "+43 659739667",
    "createdAt": "2025-09-25T13:09:33.831Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael418",
    "address": {
      "street": "Bergstraße 39",
      "city": "Dornbirn",
      "zip": "7300",
      "country": "Österreich"
    },
    "nameLower": "michael winkler",
    "abholadresse": {
      "strasse": "Bergstraße 39, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 33, Villach",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "4",
      "mittlereUmzugskartons": "13",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_419",
    "kundenNummer": "HUBI1419",
    "name": "David Fischer",
    "email": "david.fischer@example.com",
    "phone": "+43 556976478",
    "createdAt": "2025-12-18T08:15:27.059Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David419",
    "address": {
      "street": "Hauptstraße 63",
      "city": "Dornbirn",
      "zip": "5653",
      "country": "Österreich"
    },
    "nameLower": "david fischer",
    "abholadresse": {
      "strasse": "Hauptstraße 63, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 95, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "2",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_420",
    "kundenNummer": "HUBI1420",
    "name": "Maria Schmidt",
    "email": "maria.schmidt@example.com",
    "phone": "+43 226991385",
    "createdAt": "2026-02-14T15:47:26.838Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria420",
    "address": {
      "street": "Kirchenplatz 58",
      "city": "Graz",
      "zip": "9249",
      "country": "Österreich"
    },
    "nameLower": "maria schmidt",
    "abholadresse": {
      "strasse": "Kirchenplatz 58, Graz",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Schulstraße 24, Salzburg",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_421",
    "kundenNummer": "HUBI1421",
    "name": "Laura Schmidt",
    "email": "laura.schmidt@example.com",
    "phone": "+43 477103103",
    "createdAt": "2026-07-07T16:39:58.719Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura421",
    "address": {
      "street": "Gartenstraße 78",
      "city": "Salzburg",
      "zip": "7024",
      "country": "Österreich"
    },
    "nameLower": "laura schmidt",
    "abholadresse": {
      "strasse": "Gartenstraße 78, Salzburg",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bergstraße 8, Linz",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_422",
    "kundenNummer": "HUBI1422",
    "name": "Anna Pichler",
    "email": "anna.pichler@example.com",
    "phone": "+43 454583171",
    "createdAt": "2026-05-26T14:08:22.366Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna422",
    "address": {
      "street": "Bahnhofstraße 63",
      "city": "St. Pölten",
      "zip": "1092",
      "country": "Österreich"
    },
    "nameLower": "anna pichler",
    "abholadresse": {
      "strasse": "Bahnhofstraße 63, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 78, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "18",
      "mittlereUmzugskartons": "4",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_423",
    "kundenNummer": "HUBI1423",
    "name": "Anna Mayer",
    "email": "anna.mayer@example.com",
    "phone": "+43 141764449",
    "createdAt": "2025-12-21T21:42:20.199Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna423",
    "address": {
      "street": "Bergstraße 24",
      "city": "Wels",
      "zip": "2384",
      "country": "Österreich"
    },
    "nameLower": "anna mayer",
    "abholadresse": {
      "strasse": "Bergstraße 24, Wels",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 3, Wels",
      "stockwerk": "0",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_424",
    "kundenNummer": "HUBI1424",
    "name": "Anna Huber",
    "email": "anna.huber@example.com",
    "phone": "+43 476373752",
    "createdAt": "2026-01-17T07:18:16.243Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna424",
    "address": {
      "street": "Bergstraße 7",
      "city": "Klagenfurt",
      "zip": "1928",
      "country": "Österreich"
    },
    "nameLower": "anna huber",
    "abholadresse": {
      "strasse": "Bergstraße 7, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Lindenweg 48, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "25",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_425",
    "kundenNummer": "HUBI1425",
    "name": "Andreas Bauer",
    "email": "andreas.bauer@example.com",
    "phone": "+43 527468226",
    "createdAt": "2026-04-14T22:39:27.974Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas425",
    "address": {
      "street": "Bergstraße 40",
      "city": "Linz",
      "zip": "5329",
      "country": "Österreich"
    },
    "nameLower": "andreas bauer",
    "abholadresse": {
      "strasse": "Bergstraße 40, Linz",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Schulstraße 58, Linz",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "23",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_426",
    "kundenNummer": "HUBI1426",
    "name": "Maria Wagner",
    "email": "maria.wagner@example.com",
    "phone": "+43 698817471",
    "createdAt": "2026-02-07T12:08:07.497Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria426",
    "address": {
      "street": "Rathausplatz 22",
      "city": "Klagenfurt",
      "zip": "5198",
      "country": "Österreich"
    },
    "nameLower": "maria wagner",
    "abholadresse": {
      "strasse": "Rathausplatz 22, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 61, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_427",
    "kundenNummer": "HUBI1427",
    "name": "David Hofer",
    "email": "david.hofer@example.com",
    "phone": "+43 726784354",
    "createdAt": "2026-03-31T17:36:40.430Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David427",
    "address": {
      "street": "Kirchenplatz 60",
      "city": "Klagenfurt",
      "zip": "5642",
      "country": "Österreich"
    },
    "nameLower": "david hofer",
    "abholadresse": {
      "strasse": "Kirchenplatz 60, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 28, Salzburg",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "25",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_428",
    "kundenNummer": "HUBI1428",
    "name": "Katharina Eder",
    "email": "katharina.eder@example.com",
    "phone": "+43 405293027",
    "createdAt": "2026-05-28T19:48:20.870Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina428",
    "address": {
      "street": "Hauptstraße 35",
      "city": "Klagenfurt",
      "zip": "7909",
      "country": "Österreich"
    },
    "nameLower": "katharina eder",
    "abholadresse": {
      "strasse": "Hauptstraße 35, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 16, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_429",
    "kundenNummer": "HUBI1429",
    "name": "Elena Pichler",
    "email": "elena.pichler@example.com",
    "phone": "+43 842530956",
    "createdAt": "2026-04-21T07:34:44.125Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena429",
    "address": {
      "street": "Feldgasse 82",
      "city": "Linz",
      "zip": "3074",
      "country": "Österreich"
    },
    "nameLower": "elena pichler",
    "abholadresse": {
      "strasse": "Feldgasse 82, Linz",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bergstraße 24, Wels",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "17",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_430",
    "kundenNummer": "HUBI1430",
    "name": "Laura Hofer",
    "email": "laura.hofer@example.com",
    "phone": "+43 102186198",
    "createdAt": "2026-02-22T07:02:12.752Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura430",
    "address": {
      "street": "Feldgasse 21",
      "city": "Innsbruck",
      "zip": "9607",
      "country": "Österreich"
    },
    "nameLower": "laura hofer",
    "abholadresse": {
      "strasse": "Feldgasse 21, Innsbruck",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bergstraße 10, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "23",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_431",
    "kundenNummer": "HUBI1431",
    "name": "Laura Koch",
    "email": "laura.koch@example.com",
    "phone": "+43 649491405",
    "createdAt": "2026-02-17T09:18:32.805Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura431",
    "address": {
      "street": "Kirchenplatz 63",
      "city": "Wien",
      "zip": "9923",
      "country": "Österreich"
    },
    "nameLower": "laura koch",
    "abholadresse": {
      "strasse": "Kirchenplatz 63, Wien",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Feldgasse 4, Linz",
      "stockwerk": "4",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_432",
    "kundenNummer": "HUBI1432",
    "name": "Julia Weber",
    "email": "julia.weber@example.com",
    "phone": "+43 525782903",
    "createdAt": "2026-02-22T17:22:20.709Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia432",
    "address": {
      "street": "Dorfstraße 52",
      "city": "Wien",
      "zip": "2607",
      "country": "Österreich"
    },
    "nameLower": "julia weber",
    "abholadresse": {
      "strasse": "Dorfstraße 52, Wien",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bergstraße 99, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "22",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_433",
    "kundenNummer": "HUBI1433",
    "name": "Alexander Fischer",
    "email": "alexander.fischer@example.com",
    "phone": "+43 969204469",
    "createdAt": "2025-01-22T10:27:33.814Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander433",
    "address": {
      "street": "Rathausplatz 40",
      "city": "Wien",
      "zip": "9200",
      "country": "Österreich"
    },
    "nameLower": "alexander fischer",
    "abholadresse": {
      "strasse": "Rathausplatz 40, Wien",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Schulstraße 39, Wels",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "14",
      "mittlereUmzugskartons": "2",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_434",
    "kundenNummer": "HUBI1434",
    "name": "Alexander Eder",
    "email": "alexander.eder@example.com",
    "phone": "+43 663964568",
    "createdAt": "2026-07-05T04:30:38.054Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander434",
    "address": {
      "street": "Waldstraße 68",
      "city": "Dornbirn",
      "zip": "3001",
      "country": "Österreich"
    },
    "nameLower": "alexander eder",
    "abholadresse": {
      "strasse": "Waldstraße 68, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bergstraße 68, Wels",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "3",
      "mittlereUmzugskartons": "29",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_435",
    "kundenNummer": "HUBI1435",
    "name": "Sarah Koch",
    "email": "sarah.koch@example.com",
    "phone": "+43 480539180",
    "createdAt": "2025-06-20T06:48:47.232Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah435",
    "address": {
      "street": "Gartenstraße 36",
      "city": "Wels",
      "zip": "9396",
      "country": "Österreich"
    },
    "nameLower": "sarah koch",
    "abholadresse": {
      "strasse": "Gartenstraße 36, Wels",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Feldgasse 76, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "10",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_436",
    "kundenNummer": "HUBI1436",
    "name": "Maria Müller",
    "email": "maria.müller@example.com",
    "phone": "+43 388366591",
    "createdAt": "2025-01-12T11:54:51.858Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria436",
    "address": {
      "street": "Waldstraße 28",
      "city": "Wien",
      "zip": "8943",
      "country": "Österreich"
    },
    "nameLower": "maria müller",
    "abholadresse": {
      "strasse": "Waldstraße 28, Wien",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 16, Villach",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_437",
    "kundenNummer": "HUBI1437",
    "name": "Katharina Müller",
    "email": "katharina.müller@example.com",
    "phone": "+43 902647502",
    "createdAt": "2025-04-15T07:52:35.835Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina437",
    "address": {
      "street": "Rathausplatz 94",
      "city": "Dornbirn",
      "zip": "1578",
      "country": "Österreich"
    },
    "nameLower": "katharina müller",
    "abholadresse": {
      "strasse": "Rathausplatz 94, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 78, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_438",
    "kundenNummer": "HUBI1438",
    "name": "Martin Fuchs",
    "email": "martin.fuchs@example.com",
    "phone": "+43 458274444",
    "createdAt": "2025-12-09T03:49:30.189Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin438",
    "address": {
      "street": "Gartenstraße 20",
      "city": "Graz",
      "zip": "1810",
      "country": "Österreich"
    },
    "nameLower": "martin fuchs",
    "abholadresse": {
      "strasse": "Gartenstraße 20, Graz",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 51, Graz",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "24",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_439",
    "kundenNummer": "HUBI1439",
    "name": "Martin Hofer",
    "email": "martin.hofer@example.com",
    "phone": "+43 862103331",
    "createdAt": "2026-02-17T17:20:27.275Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin439",
    "address": {
      "street": "Kirchenplatz 81",
      "city": "Wels",
      "zip": "6291",
      "country": "Österreich"
    },
    "nameLower": "martin hofer",
    "abholadresse": {
      "strasse": "Kirchenplatz 81, Wels",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 6, Villach",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "11",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_440",
    "kundenNummer": "HUBI1440",
    "name": "Martin Schmid",
    "email": "martin.schmid@example.com",
    "phone": "+43 834733452",
    "createdAt": "2025-02-01T15:09:34.787Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin440",
    "address": {
      "street": "Feldgasse 36",
      "city": "Innsbruck",
      "zip": "3089",
      "country": "Österreich"
    },
    "nameLower": "martin schmid",
    "abholadresse": {
      "strasse": "Feldgasse 36, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Lindenweg 25, Salzburg",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_441",
    "kundenNummer": "HUBI1441",
    "name": "Elena Winkler",
    "email": "elena.winkler@example.com",
    "phone": "+43 385339368",
    "createdAt": "2026-02-24T10:14:14.904Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena441",
    "address": {
      "street": "Lindenweg 22",
      "city": "St. Pölten",
      "zip": "2858",
      "country": "Österreich"
    },
    "nameLower": "elena winkler",
    "abholadresse": {
      "strasse": "Lindenweg 22, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Waldstraße 36, Wien",
      "stockwerk": "1",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_442",
    "kundenNummer": "HUBI1442",
    "name": "Katharina Steiner",
    "email": "katharina.steiner@example.com",
    "phone": "+43 130737669",
    "createdAt": "2025-01-25T16:11:01.144Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina442",
    "address": {
      "street": "Feldgasse 31",
      "city": "Klagenfurt",
      "zip": "1119",
      "country": "Österreich"
    },
    "nameLower": "katharina steiner",
    "abholadresse": {
      "strasse": "Feldgasse 31, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Lindenweg 44, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "23",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_443",
    "kundenNummer": "HUBI1443",
    "name": "Sarah Hofer",
    "email": "sarah.hofer@example.com",
    "phone": "+43 145931212",
    "createdAt": "2025-05-23T15:04:06.808Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah443",
    "address": {
      "street": "Gartenstraße 78",
      "city": "Klagenfurt",
      "zip": "1019",
      "country": "Österreich"
    },
    "nameLower": "sarah hofer",
    "abholadresse": {
      "strasse": "Gartenstraße 78, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Lindenweg 32, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "12",
      "mittlereUmzugskartons": "6",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_444",
    "kundenNummer": "HUBI1444",
    "name": "Maximilian Pichler",
    "email": "maximilian.pichler@example.com",
    "phone": "+43 233190826",
    "createdAt": "2026-01-24T11:28:12.598Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maximilian444",
    "address": {
      "street": "Hauptstraße 58",
      "city": "Linz",
      "zip": "9168",
      "country": "Österreich"
    },
    "nameLower": "maximilian pichler",
    "abholadresse": {
      "strasse": "Hauptstraße 58, Linz",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 48, Villach",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "25",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_445",
    "kundenNummer": "HUBI1445",
    "name": "Katharina Hofer",
    "email": "katharina.hofer@example.com",
    "phone": "+43 435729228",
    "createdAt": "2025-10-03T21:47:05.295Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina445",
    "address": {
      "street": "Gartenstraße 81",
      "city": "St. Pölten",
      "zip": "7685",
      "country": "Österreich"
    },
    "nameLower": "katharina hofer",
    "abholadresse": {
      "strasse": "Gartenstraße 81, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 42, Salzburg",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "0",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_446",
    "kundenNummer": "HUBI1446",
    "name": "Sarah Fischer",
    "email": "sarah.fischer@example.com",
    "phone": "+43 261356667",
    "createdAt": "2025-11-19T13:48:21.987Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah446",
    "address": {
      "street": "Dorfstraße 15",
      "city": "Salzburg",
      "zip": "8153",
      "country": "Österreich"
    },
    "nameLower": "sarah fischer",
    "abholadresse": {
      "strasse": "Dorfstraße 15, Salzburg",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 10, Salzburg",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "4",
      "mittlereUmzugskartons": "6",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_447",
    "kundenNummer": "HUBI1447",
    "name": "Michael Fischer",
    "email": "michael.fischer@example.com",
    "phone": "+43 938468176",
    "createdAt": "2025-01-30T15:05:50.144Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael447",
    "address": {
      "street": "Wiesenweg 31",
      "city": "Wels",
      "zip": "4703",
      "country": "Österreich"
    },
    "nameLower": "michael fischer",
    "abholadresse": {
      "strasse": "Wiesenweg 31, Wels",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 78, Salzburg",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "23",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_448",
    "kundenNummer": "HUBI1448",
    "name": "Elena Gruber",
    "email": "elena.gruber@example.com",
    "phone": "+43 828819661",
    "createdAt": "2025-11-06T11:57:12.337Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena448",
    "address": {
      "street": "Bergstraße 26",
      "city": "Klagenfurt",
      "zip": "7756",
      "country": "Österreich"
    },
    "nameLower": "elena gruber",
    "abholadresse": {
      "strasse": "Bergstraße 26, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Schulstraße 6, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "3",
      "mittlereUmzugskartons": "5",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_449",
    "kundenNummer": "HUBI1449",
    "name": "Stefan Fuchs",
    "email": "stefan.fuchs@example.com",
    "phone": "+43 815722057",
    "createdAt": "2025-08-24T15:28:48.270Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan449",
    "address": {
      "street": "Feldgasse 52",
      "city": "Villach",
      "zip": "1981",
      "country": "Österreich"
    },
    "nameLower": "stefan fuchs",
    "abholadresse": {
      "strasse": "Feldgasse 52, Villach",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 18, Salzburg",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "12",
      "mittlereUmzugskartons": "3",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_450",
    "kundenNummer": "HUBI1450",
    "name": "Katharina Hofer",
    "email": "katharina.hofer@example.com",
    "phone": "+43 218894972",
    "createdAt": "2026-02-15T08:58:05.351Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina450",
    "address": {
      "street": "Rathausplatz 15",
      "city": "Villach",
      "zip": "9936",
      "country": "Österreich"
    },
    "nameLower": "katharina hofer",
    "abholadresse": {
      "strasse": "Rathausplatz 15, Villach",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 37, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "4",
      "mittlereUmzugskartons": "13",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_451",
    "kundenNummer": "HUBI1451",
    "name": "Stefan Bauer",
    "email": "stefan.bauer@example.com",
    "phone": "+43 179506458",
    "createdAt": "2026-04-17T06:48:16.091Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan451",
    "address": {
      "street": "Waldstraße 79",
      "city": "Villach",
      "zip": "1968",
      "country": "Österreich"
    },
    "nameLower": "stefan bauer",
    "abholadresse": {
      "strasse": "Waldstraße 79, Villach",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 10, Linz",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_452",
    "kundenNummer": "HUBI1452",
    "name": "Martin Weber",
    "email": "martin.weber@example.com",
    "phone": "+43 420148801",
    "createdAt": "2026-04-20T05:39:04.440Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin452",
    "address": {
      "street": "Lindenweg 85",
      "city": "Klagenfurt",
      "zip": "4873",
      "country": "Österreich"
    },
    "nameLower": "martin weber",
    "abholadresse": {
      "strasse": "Lindenweg 85, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Waldstraße 88, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_453",
    "kundenNummer": "HUBI1453",
    "name": "Martin Schmid",
    "email": "martin.schmid@example.com",
    "phone": "+43 175417598",
    "createdAt": "2026-07-31T21:27:10.774Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin453",
    "address": {
      "street": "Bahnhofstraße 6",
      "city": "Graz",
      "zip": "9173",
      "country": "Österreich"
    },
    "nameLower": "martin schmid",
    "abholadresse": {
      "strasse": "Bahnhofstraße 6, Graz",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Feldgasse 39, Wels",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "9",
      "mittlereUmzugskartons": "25",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_454",
    "kundenNummer": "HUBI1454",
    "name": "Lisa Steiner",
    "email": "lisa.steiner@example.com",
    "phone": "+43 280897866",
    "createdAt": "2025-04-13T11:49:20.023Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa454",
    "address": {
      "street": "Hauptstraße 29",
      "city": "Linz",
      "zip": "5891",
      "country": "Österreich"
    },
    "nameLower": "lisa steiner",
    "abholadresse": {
      "strasse": "Hauptstraße 29, Linz",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Feldgasse 92, Salzburg",
      "stockwerk": "4",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_455",
    "kundenNummer": "HUBI1455",
    "name": "Alexander Gruber",
    "email": "alexander.gruber@example.com",
    "phone": "+43 496997399",
    "createdAt": "2026-05-15T07:04:19.785Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander455",
    "address": {
      "street": "Kirchenplatz 31",
      "city": "Innsbruck",
      "zip": "6824",
      "country": "Österreich"
    },
    "nameLower": "alexander gruber",
    "abholadresse": {
      "strasse": "Kirchenplatz 31, Innsbruck",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 88, Wien",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_456",
    "kundenNummer": "HUBI1456",
    "name": "Michael Fuchs",
    "email": "michael.fuchs@example.com",
    "phone": "+43 127003225",
    "createdAt": "2025-12-24T21:14:08.234Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael456",
    "address": {
      "street": "Bergstraße 46",
      "city": "Innsbruck",
      "zip": "3156",
      "country": "Österreich"
    },
    "nameLower": "michael fuchs",
    "abholadresse": {
      "strasse": "Bergstraße 46, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 37, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_457",
    "kundenNummer": "HUBI1457",
    "name": "Laura Schmid",
    "email": "laura.schmid@example.com",
    "phone": "+43 114065830",
    "createdAt": "2025-02-16T13:47:19.019Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura457",
    "address": {
      "street": "Kirchenplatz 57",
      "city": "Graz",
      "zip": "6838",
      "country": "Österreich"
    },
    "nameLower": "laura schmid",
    "abholadresse": {
      "strasse": "Kirchenplatz 57, Graz",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 17, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_458",
    "kundenNummer": "HUBI1458",
    "name": "Elena Fuchs",
    "email": "elena.fuchs@example.com",
    "phone": "+43 187523730",
    "createdAt": "2026-07-05T20:25:19.120Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena458",
    "address": {
      "street": "Kirchenplatz 56",
      "city": "Klagenfurt",
      "zip": "8491",
      "country": "Österreich"
    },
    "nameLower": "elena fuchs",
    "abholadresse": {
      "strasse": "Kirchenplatz 56, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bergstraße 59, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "5",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_459",
    "kundenNummer": "HUBI1459",
    "name": "Stefan Weber",
    "email": "stefan.weber@example.com",
    "phone": "+43 893149101",
    "createdAt": "2026-07-14T10:15:36.989Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan459",
    "address": {
      "street": "Bergstraße 58",
      "city": "Klagenfurt",
      "zip": "4933",
      "country": "Österreich"
    },
    "nameLower": "stefan weber",
    "abholadresse": {
      "strasse": "Bergstraße 58, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Waldstraße 21, Wien",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "27",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_460",
    "kundenNummer": "HUBI1460",
    "name": "Anna Mayer",
    "email": "anna.mayer@example.com",
    "phone": "+43 762673865",
    "createdAt": "2025-11-17T03:12:57.740Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna460",
    "address": {
      "street": "Kirchenplatz 55",
      "city": "St. Pölten",
      "zip": "3626",
      "country": "Österreich"
    },
    "nameLower": "anna mayer",
    "abholadresse": {
      "strasse": "Kirchenplatz 55, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 49, Villach",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "21",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_461",
    "kundenNummer": "HUBI1461",
    "name": "Thomas Müller",
    "email": "thomas.müller@example.com",
    "phone": "+43 822157626",
    "createdAt": "2026-07-14T05:08:29.098Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas461",
    "address": {
      "street": "Rathausplatz 93",
      "city": "Dornbirn",
      "zip": "1541",
      "country": "Österreich"
    },
    "nameLower": "thomas müller",
    "abholadresse": {
      "strasse": "Rathausplatz 93, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 77, Salzburg",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "16",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_462",
    "kundenNummer": "HUBI1462",
    "name": "Stefan Moser",
    "email": "stefan.moser@example.com",
    "phone": "+43 774943664",
    "createdAt": "2025-05-14T22:14:29.086Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan462",
    "address": {
      "street": "Wiesenweg 64",
      "city": "Graz",
      "zip": "3968",
      "country": "Österreich"
    },
    "nameLower": "stefan moser",
    "abholadresse": {
      "strasse": "Wiesenweg 64, Graz",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 6, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "12",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_463",
    "kundenNummer": "HUBI1463",
    "name": "Julia Bauer",
    "email": "julia.bauer@example.com",
    "phone": "+43 406849560",
    "createdAt": "2025-01-30T04:22:18.879Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia463",
    "address": {
      "street": "Waldstraße 22",
      "city": "St. Pölten",
      "zip": "8516",
      "country": "Österreich"
    },
    "nameLower": "julia bauer",
    "abholadresse": {
      "strasse": "Waldstraße 22, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Schulstraße 18, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "18",
      "mittlereUmzugskartons": "8",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_464",
    "kundenNummer": "HUBI1464",
    "name": "Lukas Weber",
    "email": "lukas.weber@example.com",
    "phone": "+43 337519696",
    "createdAt": "2025-05-21T09:50:05.763Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas464",
    "address": {
      "street": "Gartenstraße 41",
      "city": "Wien",
      "zip": "8274",
      "country": "Österreich"
    },
    "nameLower": "lukas weber",
    "abholadresse": {
      "strasse": "Gartenstraße 41, Wien",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 47, Graz",
      "stockwerk": "0",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_465",
    "kundenNummer": "HUBI1465",
    "name": "Sarah Bauer",
    "email": "sarah.bauer@example.com",
    "phone": "+43 116003878",
    "createdAt": "2025-09-10T07:35:11.621Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah465",
    "address": {
      "street": "Gartenstraße 60",
      "city": "Graz",
      "zip": "3531",
      "country": "Österreich"
    },
    "nameLower": "sarah bauer",
    "abholadresse": {
      "strasse": "Gartenstraße 60, Graz",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 96, Wels",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "9",
      "mittlereUmzugskartons": "29",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_466",
    "kundenNummer": "HUBI1466",
    "name": "Christian Koch",
    "email": "christian.koch@example.com",
    "phone": "+43 540773985",
    "createdAt": "2026-01-03T11:45:20.670Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian466",
    "address": {
      "street": "Dorfstraße 55",
      "city": "St. Pölten",
      "zip": "2176",
      "country": "Österreich"
    },
    "nameLower": "christian koch",
    "abholadresse": {
      "strasse": "Dorfstraße 55, St. Pölten",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 20, Graz",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "18",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_467",
    "kundenNummer": "HUBI1467",
    "name": "Katharina Mayer",
    "email": "katharina.mayer@example.com",
    "phone": "+43 406238661",
    "createdAt": "2026-07-07T04:58:32.487Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina467",
    "address": {
      "street": "Bahnhofstraße 88",
      "city": "Klagenfurt",
      "zip": "4969",
      "country": "Österreich"
    },
    "nameLower": "katharina mayer",
    "abholadresse": {
      "strasse": "Bahnhofstraße 88, Klagenfurt",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Feldgasse 88, Villach",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "3",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_468",
    "kundenNummer": "HUBI1468",
    "name": "Katharina Reiter",
    "email": "katharina.reiter@example.com",
    "phone": "+43 181050721",
    "createdAt": "2026-01-12T10:26:08.723Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina468",
    "address": {
      "street": "Bahnhofstraße 31",
      "city": "Graz",
      "zip": "3991",
      "country": "Österreich"
    },
    "nameLower": "katharina reiter",
    "abholadresse": {
      "strasse": "Bahnhofstraße 31, Graz",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Waldstraße 79, Salzburg",
      "stockwerk": "0",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_469",
    "kundenNummer": "HUBI1469",
    "name": "Michael Berger",
    "email": "michael.berger@example.com",
    "phone": "+43 583303352",
    "createdAt": "2025-02-19T06:04:10.580Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael469",
    "address": {
      "street": "Bahnhofstraße 49",
      "city": "St. Pölten",
      "zip": "4950",
      "country": "Österreich"
    },
    "nameLower": "michael berger",
    "abholadresse": {
      "strasse": "Bahnhofstraße 49, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 81, Dornbirn",
      "stockwerk": "1",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_470",
    "kundenNummer": "HUBI1470",
    "name": "Stefan Winkler",
    "email": "stefan.winkler@example.com",
    "phone": "+43 664783787",
    "createdAt": "2026-01-20T21:33:41.122Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan470",
    "address": {
      "street": "Bergstraße 93",
      "city": "Innsbruck",
      "zip": "3185",
      "country": "Österreich"
    },
    "nameLower": "stefan winkler",
    "abholadresse": {
      "strasse": "Bergstraße 93, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Feldgasse 25, Villach",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_471",
    "kundenNummer": "HUBI1471",
    "name": "Lukas Schmidt",
    "email": "lukas.schmidt@example.com",
    "phone": "+43 313637005",
    "createdAt": "2025-10-07T03:02:47.173Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas471",
    "address": {
      "street": "Hauptstraße 38",
      "city": "Linz",
      "zip": "4900",
      "country": "Österreich"
    },
    "nameLower": "lukas schmidt",
    "abholadresse": {
      "strasse": "Hauptstraße 38, Linz",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Waldstraße 66, Villach",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "8",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_472",
    "kundenNummer": "HUBI1472",
    "name": "Laura Schmid",
    "email": "laura.schmid@example.com",
    "phone": "+43 483833620",
    "createdAt": "2026-04-26T17:00:14.372Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura472",
    "address": {
      "street": "Lindenweg 23",
      "city": "Graz",
      "zip": "3679",
      "country": "Österreich"
    },
    "nameLower": "laura schmid",
    "abholadresse": {
      "strasse": "Lindenweg 23, Graz",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 68, Linz",
      "stockwerk": "3",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_473",
    "kundenNummer": "HUBI1473",
    "name": "Martin Winkler",
    "email": "martin.winkler@example.com",
    "phone": "+43 849856492",
    "createdAt": "2025-03-21T02:20:55.039Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin473",
    "address": {
      "street": "Gartenstraße 98",
      "city": "Linz",
      "zip": "9768",
      "country": "Österreich"
    },
    "nameLower": "martin winkler",
    "abholadresse": {
      "strasse": "Gartenstraße 98, Linz",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Feldgasse 25, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "3",
      "mittlereUmzugskartons": "12",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_474",
    "kundenNummer": "HUBI1474",
    "name": "Sophie Fischer",
    "email": "sophie.fischer@example.com",
    "phone": "+43 980603378",
    "createdAt": "2025-11-18T03:03:30.070Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie474",
    "address": {
      "street": "Lindenweg 25",
      "city": "Klagenfurt",
      "zip": "6717",
      "country": "Österreich"
    },
    "nameLower": "sophie fischer",
    "abholadresse": {
      "strasse": "Lindenweg 25, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bergstraße 33, Graz",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "5",
      "mittlereUmzugskartons": "28",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_475",
    "kundenNummer": "HUBI1475",
    "name": "Anna Fischer",
    "email": "anna.fischer@example.com",
    "phone": "+43 285400066",
    "createdAt": "2025-09-08T09:38:28.323Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna475",
    "address": {
      "street": "Waldstraße 5",
      "city": "Graz",
      "zip": "5487",
      "country": "Österreich"
    },
    "nameLower": "anna fischer",
    "abholadresse": {
      "strasse": "Waldstraße 5, Graz",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 4, Wien",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "0",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_476",
    "kundenNummer": "HUBI1476",
    "name": "Elena Fuchs",
    "email": "elena.fuchs@example.com",
    "phone": "+43 846199847",
    "createdAt": "2025-04-23T20:15:50.858Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena476",
    "address": {
      "street": "Rathausplatz 1",
      "city": "Wien",
      "zip": "5039",
      "country": "Österreich"
    },
    "nameLower": "elena fuchs",
    "abholadresse": {
      "strasse": "Rathausplatz 1, Wien",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Waldstraße 93, Graz",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "4",
      "mittlereUmzugskartons": "4",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_477",
    "kundenNummer": "HUBI1477",
    "name": "Alexander Reiter",
    "email": "alexander.reiter@example.com",
    "phone": "+43 591083975",
    "createdAt": "2026-01-10T00:44:38.560Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander477",
    "address": {
      "street": "Lindenweg 78",
      "city": "Klagenfurt",
      "zip": "9277",
      "country": "Österreich"
    },
    "nameLower": "alexander reiter",
    "abholadresse": {
      "strasse": "Lindenweg 78, Klagenfurt",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 5, Salzburg",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "21",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_478",
    "kundenNummer": "HUBI1478",
    "name": "Laura Bauer",
    "email": "laura.bauer@example.com",
    "phone": "+43 363832635",
    "createdAt": "2026-01-15T23:31:59.860Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura478",
    "address": {
      "street": "Wiesenweg 9",
      "city": "Salzburg",
      "zip": "4940",
      "country": "Österreich"
    },
    "nameLower": "laura bauer",
    "abholadresse": {
      "strasse": "Wiesenweg 9, Salzburg",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 24, Salzburg",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "15",
      "mittlereUmzugskartons": "14",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_479",
    "kundenNummer": "HUBI1479",
    "name": "Sarah Koch",
    "email": "sarah.koch@example.com",
    "phone": "+43 456471712",
    "createdAt": "2026-04-16T17:43:12.623Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah479",
    "address": {
      "street": "Bahnhofstraße 94",
      "city": "Linz",
      "zip": "7367",
      "country": "Österreich"
    },
    "nameLower": "sarah koch",
    "abholadresse": {
      "strasse": "Bahnhofstraße 94, Linz",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 20, Salzburg",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "19",
      "mittlereUmzugskartons": "8",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_480",
    "kundenNummer": "HUBI1480",
    "name": "Thomas Mayer",
    "email": "thomas.mayer@example.com",
    "phone": "+43 442734680",
    "createdAt": "2025-05-28T14:34:24.461Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas480",
    "address": {
      "street": "Hauptstraße 44",
      "city": "Wien",
      "zip": "1038",
      "country": "Österreich"
    },
    "nameLower": "thomas mayer",
    "abholadresse": {
      "strasse": "Hauptstraße 44, Wien",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Lindenweg 7, Villach",
      "stockwerk": "1",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_481",
    "kundenNummer": "HUBI1481",
    "name": "Michael Fischer",
    "email": "michael.fischer@example.com",
    "phone": "+43 489509804",
    "createdAt": "2025-11-07T15:41:28.212Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael481",
    "address": {
      "street": "Lindenweg 91",
      "city": "Klagenfurt",
      "zip": "5538",
      "country": "Österreich"
    },
    "nameLower": "michael fischer",
    "abholadresse": {
      "strasse": "Lindenweg 91, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 51, Linz",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_482",
    "kundenNummer": "HUBI1482",
    "name": "Christina Wagner",
    "email": "christina.wagner@example.com",
    "phone": "+43 253222953",
    "createdAt": "2025-12-02T16:09:25.836Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina482",
    "address": {
      "street": "Hauptstraße 74",
      "city": "St. Pölten",
      "zip": "2207",
      "country": "Österreich"
    },
    "nameLower": "christina wagner",
    "abholadresse": {
      "strasse": "Hauptstraße 74, St. Pölten",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 30, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "18",
      "mittlereUmzugskartons": "11",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_483",
    "kundenNummer": "HUBI1483",
    "name": "Alexander Steiner",
    "email": "alexander.steiner@example.com",
    "phone": "+43 886321646",
    "createdAt": "2025-04-02T03:27:51.035Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander483",
    "address": {
      "street": "Waldstraße 20",
      "city": "Innsbruck",
      "zip": "8225",
      "country": "Österreich"
    },
    "nameLower": "alexander steiner",
    "abholadresse": {
      "strasse": "Waldstraße 20, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Feldgasse 63, Wien",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_484",
    "kundenNummer": "HUBI1484",
    "name": "Anna Winkler",
    "email": "anna.winkler@example.com",
    "phone": "+43 405585041",
    "createdAt": "2026-04-26T03:19:16.877Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna484",
    "address": {
      "street": "Gartenstraße 22",
      "city": "Klagenfurt",
      "zip": "1137",
      "country": "Österreich"
    },
    "nameLower": "anna winkler",
    "abholadresse": {
      "strasse": "Gartenstraße 22, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Feldgasse 85, Wels",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_485",
    "kundenNummer": "HUBI1485",
    "name": "Anna Bauer",
    "email": "anna.bauer@example.com",
    "phone": "+43 857042177",
    "createdAt": "2025-10-20T04:50:32.771Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna485",
    "address": {
      "street": "Gartenstraße 38",
      "city": "Wels",
      "zip": "7511",
      "country": "Österreich"
    },
    "nameLower": "anna bauer",
    "abholadresse": {
      "strasse": "Gartenstraße 38, Wels",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 66, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_486",
    "kundenNummer": "HUBI1486",
    "name": "Laura Huber",
    "email": "laura.huber@example.com",
    "phone": "+43 907244796",
    "createdAt": "2026-05-14T09:37:03.993Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura486",
    "address": {
      "street": "Lindenweg 11",
      "city": "Dornbirn",
      "zip": "1608",
      "country": "Österreich"
    },
    "nameLower": "laura huber",
    "abholadresse": {
      "strasse": "Lindenweg 11, Dornbirn",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Lindenweg 54, Wels",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "10",
      "mittlereUmzugskartons": "8",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_487",
    "kundenNummer": "HUBI1487",
    "name": "Andreas Weber",
    "email": "andreas.weber@example.com",
    "phone": "+43 552258799",
    "createdAt": "2025-07-18T05:04:57.456Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Andreas487",
    "address": {
      "street": "Gartenstraße 18",
      "city": "Graz",
      "zip": "8115",
      "country": "Österreich"
    },
    "nameLower": "andreas weber",
    "abholadresse": {
      "strasse": "Gartenstraße 18, Graz",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 99, Graz",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "26",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_488",
    "kundenNummer": "HUBI1488",
    "name": "Lukas Steiner",
    "email": "lukas.steiner@example.com",
    "phone": "+43 987531832",
    "createdAt": "2025-06-20T23:06:45.703Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas488",
    "address": {
      "street": "Feldgasse 62",
      "city": "Wien",
      "zip": "5188",
      "country": "Österreich"
    },
    "nameLower": "lukas steiner",
    "abholadresse": {
      "strasse": "Feldgasse 62, Wien",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Feldgasse 23, Linz",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "6",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_489",
    "kundenNummer": "HUBI1489",
    "name": "Laura Schmid",
    "email": "laura.schmid@example.com",
    "phone": "+43 659603530",
    "createdAt": "2026-07-05T18:07:51.481Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura489",
    "address": {
      "street": "Lindenweg 37",
      "city": "St. Pölten",
      "zip": "9479",
      "country": "Österreich"
    },
    "nameLower": "laura schmid",
    "abholadresse": {
      "strasse": "Lindenweg 37, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 52, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "7",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_490",
    "kundenNummer": "HUBI1490",
    "name": "Julia Steiner",
    "email": "julia.steiner@example.com",
    "phone": "+43 825725288",
    "createdAt": "2025-06-09T00:04:08.406Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia490",
    "address": {
      "street": "Feldgasse 7",
      "city": "Klagenfurt",
      "zip": "2089",
      "country": "Österreich"
    },
    "nameLower": "julia steiner",
    "abholadresse": {
      "strasse": "Feldgasse 7, Klagenfurt",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 19, Linz",
      "stockwerk": "1",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "18",
      "mittlereUmzugskartons": "25",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_491",
    "kundenNummer": "HUBI1491",
    "name": "Anna Weber",
    "email": "anna.weber@example.com",
    "phone": "+43 657823780",
    "createdAt": "2025-12-14T12:04:03.145Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna491",
    "address": {
      "street": "Wiesenweg 60",
      "city": "Graz",
      "zip": "1928",
      "country": "Österreich"
    },
    "nameLower": "anna weber",
    "abholadresse": {
      "strasse": "Wiesenweg 60, Graz",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 11, Linz",
      "stockwerk": "4",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "21",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_492",
    "kundenNummer": "HUBI1492",
    "name": "David Berger",
    "email": "david.berger@example.com",
    "phone": "+43 853915837",
    "createdAt": "2025-12-11T22:31:57.365Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David492",
    "address": {
      "street": "Schulstraße 84",
      "city": "Wels",
      "zip": "4567",
      "country": "Österreich"
    },
    "nameLower": "david berger",
    "abholadresse": {
      "strasse": "Schulstraße 84, Wels",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Schulstraße 41, Graz",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "6",
      "mittlereUmzugskartons": "9",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_493",
    "kundenNummer": "HUBI1493",
    "name": "Anna Huber",
    "email": "anna.huber@example.com",
    "phone": "+43 708936794",
    "createdAt": "2025-04-24T22:25:17.058Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna493",
    "address": {
      "street": "Dorfstraße 77",
      "city": "Graz",
      "zip": "1362",
      "country": "Österreich"
    },
    "nameLower": "anna huber",
    "abholadresse": {
      "strasse": "Dorfstraße 77, Graz",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Waldstraße 47, Graz",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "22",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_494",
    "kundenNummer": "HUBI1494",
    "name": "Lukas Schmidt",
    "email": "lukas.schmidt@example.com",
    "phone": "+43 540796472",
    "createdAt": "2025-01-18T19:04:59.776Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas494",
    "address": {
      "street": "Schulstraße 67",
      "city": "Villach",
      "zip": "2580",
      "country": "Österreich"
    },
    "nameLower": "lukas schmidt",
    "abholadresse": {
      "strasse": "Schulstraße 67, Villach",
      "stockwerk": "3",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bergstraße 25, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_495",
    "kundenNummer": "HUBI1495",
    "name": "Lisa Berger",
    "email": "lisa.berger@example.com",
    "phone": "+43 382333435",
    "createdAt": "2026-06-13T03:27:36.204Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa495",
    "address": {
      "street": "Wiesenweg 10",
      "city": "Wien",
      "zip": "4381",
      "country": "Österreich"
    },
    "nameLower": "lisa berger",
    "abholadresse": {
      "strasse": "Wiesenweg 10, Wien",
      "stockwerk": "3",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Wiesenweg 93, Dornbirn",
      "stockwerk": "3",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "11",
      "mittlereUmzugskartons": "0",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_496",
    "kundenNummer": "HUBI1496",
    "name": "Anna Weber",
    "email": "anna.weber@example.com",
    "phone": "+43 839114302",
    "createdAt": "2026-07-12T16:55:05.617Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna496",
    "address": {
      "street": "Bergstraße 81",
      "city": "Innsbruck",
      "zip": "6502",
      "country": "Österreich"
    },
    "nameLower": "anna weber",
    "abholadresse": {
      "strasse": "Bergstraße 81, Innsbruck",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Lindenweg 88, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "21",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_497",
    "kundenNummer": "HUBI1497",
    "name": "Christina Mayer",
    "email": "christina.mayer@example.com",
    "phone": "+43 121830058",
    "createdAt": "2026-06-07T01:52:54.647Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christina497",
    "address": {
      "street": "Waldstraße 6",
      "city": "Innsbruck",
      "zip": "7101",
      "country": "Österreich"
    },
    "nameLower": "christina mayer",
    "abholadresse": {
      "strasse": "Waldstraße 6, Innsbruck",
      "stockwerk": "4",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Feldgasse 38, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_498",
    "kundenNummer": "HUBI1498",
    "name": "Christian Berger",
    "email": "christian.berger@example.com",
    "phone": "+43 231854105",
    "createdAt": "2026-05-15T23:27:24.947Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian498",
    "address": {
      "street": "Lindenweg 43",
      "city": "Graz",
      "zip": "8303",
      "country": "Österreich"
    },
    "nameLower": "christian berger",
    "abholadresse": {
      "strasse": "Lindenweg 43, Graz",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 40, Salzburg",
      "stockwerk": "2",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "11",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_499",
    "kundenNummer": "HUBI1499",
    "name": "Alexander Müller",
    "email": "alexander.müller@example.com",
    "phone": "+43 867829086",
    "createdAt": "2025-05-30T00:39:23.418Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander499",
    "address": {
      "street": "Bahnhofstraße 67",
      "city": "Klagenfurt",
      "zip": "8944",
      "country": "Österreich"
    },
    "nameLower": "alexander müller",
    "abholadresse": {
      "strasse": "Bahnhofstraße 67, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Lindenweg 68, Dornbirn",
      "stockwerk": "0",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "7",
      "mittlereUmzugskartons": "0",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_500",
    "kundenNummer": "HUBI1500",
    "name": "David Berger",
    "email": "david.berger@example.com",
    "phone": "+43 941736021",
    "createdAt": "2025-06-18T01:27:59.961Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David500",
    "address": {
      "street": "Wiesenweg 3",
      "city": "Graz",
      "zip": "2326",
      "country": "Österreich"
    },
    "nameLower": "david berger",
    "abholadresse": {
      "strasse": "Wiesenweg 3, Graz",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 59, Villach",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "4",
      "mittlereUmzugskartons": "27",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_501",
    "kundenNummer": "HUBI1501",
    "name": "Sophie Eder",
    "email": "sophie.eder@example.com",
    "phone": "+43 685758891",
    "createdAt": "2026-04-04T02:44:10.023Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie501",
    "address": {
      "street": "Gartenstraße 52",
      "city": "Salzburg",
      "zip": "2223",
      "country": "Österreich"
    },
    "nameLower": "sophie eder",
    "abholadresse": {
      "strasse": "Gartenstraße 52, Salzburg",
      "stockwerk": "0",
      "aufzug": "Ja",
      "entfernungLKW": "10"
    },
    "zieladresse": {
      "strasse": "Bergstraße 97, Linz",
      "stockwerk": "3",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "1",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_502",
    "kundenNummer": "HUBI1502",
    "name": "Alexander Koch",
    "email": "alexander.koch@example.com",
    "phone": "+43 548913638",
    "createdAt": "2025-10-08T04:49:26.689Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander502",
    "address": {
      "street": "Bahnhofstraße 42",
      "city": "St. Pölten",
      "zip": "7298",
      "country": "Österreich"
    },
    "nameLower": "alexander koch",
    "abholadresse": {
      "strasse": "Bahnhofstraße 42, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bergstraße 86, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_503",
    "kundenNummer": "HUBI1503",
    "name": "David Reiter",
    "email": "david.reiter@example.com",
    "phone": "+43 953809709",
    "createdAt": "2025-10-23T09:43:16.688Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=David503",
    "address": {
      "street": "Waldstraße 93",
      "city": "Graz",
      "zip": "7756",
      "country": "Österreich"
    },
    "nameLower": "david reiter",
    "abholadresse": {
      "strasse": "Waldstraße 93, Graz",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 63, Klagenfurt",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "13",
      "mittlereUmzugskartons": "25",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_504",
    "kundenNummer": "HUBI1504",
    "name": "Stefan Moser",
    "email": "stefan.moser@example.com",
    "phone": "+43 242254105",
    "createdAt": "2025-04-23T20:16:18.015Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan504",
    "address": {
      "street": "Kirchenplatz 37",
      "city": "St. Pölten",
      "zip": "5314",
      "country": "Österreich"
    },
    "nameLower": "stefan moser",
    "abholadresse": {
      "strasse": "Kirchenplatz 37, St. Pölten",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Rathausplatz 51, Wien",
      "stockwerk": "2",
      "aufzug": "Nein"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "9",
      "mittlereUmzugskartons": "18",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_505",
    "kundenNummer": "HUBI1505",
    "name": "Michael Moser",
    "email": "michael.moser@example.com",
    "phone": "+43 646865154",
    "createdAt": "2025-01-02T09:19:41.527Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael505",
    "address": {
      "street": "Lindenweg 72",
      "city": "Linz",
      "zip": "6933",
      "country": "Österreich"
    },
    "nameLower": "michael moser",
    "abholadresse": {
      "strasse": "Lindenweg 72, Linz",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 25, Wels",
      "stockwerk": "0",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "8",
      "mittlereUmzugskartons": "25",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_506",
    "kundenNummer": "HUBI1506",
    "name": "Michael Koch",
    "email": "michael.koch@example.com",
    "phone": "+43 564793605",
    "createdAt": "2025-10-24T20:47:41.241Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael506",
    "address": {
      "street": "Lindenweg 39",
      "city": "Klagenfurt",
      "zip": "8956",
      "country": "Österreich"
    },
    "nameLower": "michael koch",
    "abholadresse": {
      "strasse": "Lindenweg 39, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Schulstraße 66, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_507",
    "kundenNummer": "HUBI1507",
    "name": "Lukas Pichler",
    "email": "lukas.pichler@example.com",
    "phone": "+43 490461819",
    "createdAt": "2026-01-14T15:02:45.924Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lukas507",
    "address": {
      "street": "Dorfstraße 63",
      "city": "St. Pölten",
      "zip": "3233",
      "country": "Österreich"
    },
    "nameLower": "lukas pichler",
    "abholadresse": {
      "strasse": "Dorfstraße 63, St. Pölten",
      "stockwerk": "0",
      "aufzug": "Nein",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Hauptstraße 56, St. Pölten",
      "stockwerk": "1",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "1",
      "mittlereUmzugskartons": "3",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": true
    }
  },
  {
    "id": "cus_auto_508",
    "kundenNummer": "HUBI1508",
    "name": "Alexander Winkler",
    "email": "alexander.winkler@example.com",
    "phone": "+43 956460931",
    "createdAt": "2026-06-14T17:40:41.502Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander508",
    "address": {
      "street": "Kirchenplatz 57",
      "city": "Wels",
      "zip": "3973",
      "country": "Österreich"
    },
    "nameLower": "alexander winkler",
    "abholadresse": {
      "strasse": "Kirchenplatz 57, Wels",
      "stockwerk": "4",
      "aufzug": "Ja",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Bahnhofstraße 62, Dornbirn",
      "stockwerk": "4",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_509",
    "kundenNummer": "HUBI1509",
    "name": "Christian Huber",
    "email": "christian.huber@example.com",
    "phone": "+43 416521195",
    "createdAt": "2026-03-25T06:28:07.705Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Christian509",
    "address": {
      "street": "Feldgasse 12",
      "city": "Villach",
      "zip": "5515",
      "country": "Österreich"
    },
    "nameLower": "christian huber",
    "abholadresse": {
      "strasse": "Feldgasse 12, Villach",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "15"
    },
    "zieladresse": {
      "strasse": "Gartenstraße 46, Wels",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "16",
      "mittlereUmzugskartons": "28",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  },
  {
    "id": "cus_auto_510",
    "kundenNummer": "HUBI1510",
    "name": "Katharina Berger",
    "email": "katharina.berger@example.com",
    "phone": "+43 630811958",
    "createdAt": "2025-05-15T04:27:16.154Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Katharina510",
    "address": {
      "street": "Lindenweg 50",
      "city": "Villach",
      "zip": "9948",
      "country": "Österreich"
    },
    "nameLower": "katharina berger",
    "abholadresse": {
      "strasse": "Lindenweg 50, Villach",
      "stockwerk": "1",
      "aufzug": "Ja",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Kirchenplatz 75, Innsbruck",
      "stockwerk": "2",
      "aufzug": "Nein"
    }
  },
  {
    "id": "cus_auto_511",
    "kundenNummer": "HUBI1511",
    "name": "Michael Hofer",
    "email": "michael.hofer@example.com",
    "phone": "+43 997200228",
    "createdAt": "2025-12-24T11:53:22.242Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael511",
    "address": {
      "street": "Schulstraße 89",
      "city": "Klagenfurt",
      "zip": "9822",
      "country": "Österreich"
    },
    "nameLower": "michael hofer",
    "abholadresse": {
      "strasse": "Schulstraße 89, Klagenfurt",
      "stockwerk": "2",
      "aufzug": "Nein",
      "entfernungLKW": "5"
    },
    "zieladresse": {
      "strasse": "Dorfstraße 97, Villach",
      "stockwerk": "4",
      "aufzug": "Ja"
    }
  },
  {
    "id": "cus_auto_512",
    "kundenNummer": "HUBI1512",
    "name": "Michael Mayer",
    "email": "michael.mayer@example.com",
    "phone": "+43 112249339",
    "createdAt": "2026-07-06T07:37:47.310Z",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael512",
    "address": {
      "street": "Bergstraße 93",
      "city": "Salzburg",
      "zip": "8216",
      "country": "Österreich"
    },
    "nameLower": "michael mayer",
    "abholadresse": {
      "strasse": "Bergstraße 93, Salzburg",
      "stockwerk": "2",
      "aufzug": "Ja",
      "entfernungLKW": "20"
    },
    "zieladresse": {
      "strasse": "Lindenweg 67, Wels",
      "stockwerk": "4",
      "aufzug": "Ja"
    },
    "gegenstaende": {
      "kleineUmzugskartons": "17",
      "mittlereUmzugskartons": "9",
      "wohnzimmer": true,
      "schlafzimmer": true,
      "kueche": false
    }
  }
];
