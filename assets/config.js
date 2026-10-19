// =============================================================
//  PODEŠAVANJA SAJTA
//  Ovde menjaš podatke firme i vezu sa bazom. Ostali fajlovi
//  čitaju podatke odavde, pa ih menjaš samo na jednom mestu.
// =============================================================

window.KONFIG = {
  // Veza sa Supabase bazom (javni ključ, sme da bude u sajtu)
  supabaseUrl: "https://pkabcqmjbuwedhbxzmsx.supabase.co",
  supabaseKljuc: "sb_publishable_7pW8eeoKV9dhYZVGAE3xGA_lvcEhPQv",

  // Ako ovde upišeš email, firma dobija i email za svaki nov upit
  // (preko besplatnog servisa formsubmit.co; prvi put stiže mejl za potvrdu).
  // Ostavi prazno ("") ako upiti treba da stižu samo na admin stranu.
  emailZaObavestenja: "",

  // Traka na vrhu svih strana. Za isključivanje stavi tekst: ""
  obavestenje: {
    oznaka: "Sezona zimskih guma",
    tekst: "Besplatna dostava guma po celoj Srbiji za 24–48h",
    link: "gume.html?sezona=zimska",
    linkTekst: "Pogledaj zimske gume",
  },

  firma: {
    ime: "Planeta Guma",
    pravnoIme: "Planet Tyres d.o.o.",
    osnovana: 2006,
    maticniBroj: "20236787",
    pib: "104776184",
    email: "info@planetaguma.com",
    facebook: "https://www.facebook.com/planetaguma/",
    instagram: "https://www.instagram.com/planetaguma/",
  },

  lokacije: [
    {
      ime: "Cerak",
      adresa: "Ratka Mitrovića 153, ugao sa Arčibalda Rajsa",
      telefoni: ["011 2318 949", "069 2318 974"],
      radnoVreme: ["Pon–pet 08–20h", "Subota 08–17h"],
      mapa: "https://www.google.com/maps/search/?api=1&query=Ratka+Mitrovi%C4%87a+153+Beograd",
    },
    {
      ime: "Železnik",
      adresa: "Lole Ribara 57",
      telefoni: ["011 2577 666", "069 2318 949"],
      radnoVreme: ["Pon–pet 08–20h", "Subota 08–15h"],
      mapa: "https://www.google.com/maps/search/?api=1&query=Lole+Ribara+57+Beograd",
      napomena: "−20% na vulkanizerske usluge i samouslužna perionica",
    },
  ],
};
