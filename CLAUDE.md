# Planeta Guma: sajt

Novi sajt za Planet Tyres d.o.o. (planetaguma.com), prodavnicu guma i servis sa dve lokacije u Beogradu (Cerak i Železnik). Pravi ga Miloš Drašković kao predlog za klijenta. Miloš uči web development, zato objašnjavaj jednostavno i na srpskom.

## Kako je napravljen

- Običan HTML, CSS i JavaScript. Nema React-a, nema build koraka, nema npm-a. Strane se otvaraju duplim klikom (file://).
- Zaglavlje i podnožje crta `assets/app.js` (funkcije `nacrtajZaglavlje` i `nacrtajPodnozje`), pa su na svim stranama isti. Ne kopiraj ih u HTML.
- Baza je Supabase, projekat `planeta-guma` (id `pkabcqmjbuwedhbxzmsx`, region eu-central-1). Biblioteka se učitava sa jsdelivr: `@supabase/supabase-js@2.45.4`.
- Sva podešavanja firme (telefoni, adrese, radno vreme, traka sa obaveštenjem, email za obaveštenja) su u `assets/config.js`. Tekst firme menjaj tamo, ne u HTML-u.

## Fajlovi

| Fajl | Šta radi |
|---|---|
| `index.html` | Početna: pretraga po dimenziji gume, činjenice o firmi, cenovnik usluga, česta pitanja, lokacije |
| `gume.html` + `assets/gume.js` | Gume: filteri, stanje, **Rezerviši** i **Proveri dostupnost** (gume se ne kupuju online) |
| `prodavnica.html` + `assets/prodavnica.js` | Ostali artikli: korpa u localStorage, porudžbina |
| `admin.html` + `assets/admin.js` | Admin za firmu: upiti, izmena guma i artikala, cena i stanja |
| `assets/style.css` | Svi stilovi |
| `UPUTSTVO.txt` | Uputstvo za firmu |

## Baza

- `gume`: proizvodjac, model, sirina, visina, precnik, sezona (letnja / zimska / sve sezone), tip (auto / 4x4 / kombi / kamion / moto), indeks, cena, kolicina, slika_url, opis, aktivan
- `proizvodi`: kategorija (ulja / akumulatori / felne / delovi / oprema / usluge), naziv, opis, cena (može biti prazna = "cena na upit"), slika_url, na_stanju, aktivan
- `upiti`: tip (rezervacija / dostupnost / porudzbina), ime, telefon, email, lokacija (Cerak / Železnik), poruka, stavke (jsonb), status (novo / u obradi / zavrseno / otkazano)
- `admini` + funkcija `je_admin()`: ko sme da menja podatke
- RLS: posetilac vidi samo aktivne gume i artikle i sme samo da pošalje upit. Upite čita i sve menja samo admin.

## Pravila

- Svaki tekst iz baze ide kroz `esc()` pre ubacivanja u HTML.
- localStorage i sessionStorage uvek u try/catch.
- Svi tekstovi na sajtu su na srpskom, latinica.
- Boje su CSS promenljive u `style.css`: `--asfalt`, `--guma`, `--beton`, `--linija` (žuta kao oznaka na putu), `--zelena`, `--crvena`. Fontovi: Barlow Condensed za naslove, Barlow za tekst. Ne uvodi nove boje bez razloga.
- Bez generičkih "AI" detalja: bez pilula iznad naslova, bez podizanja kartica na hover, bez naslova u četiri reda.
- Kontrast teksta najmanje 4.5:1. Sajt mora da radi na telefonu (širina 360px).
- **Nikad** ne traži i ne upisuj lozinku admina. Admin nalog firma pravi sama u Supabase dashboardu, a nama šalje samo email, pa ga dodajemo u `admini`.
- Upiti se ne šalju na pravi email firme dok firma ne pristane.
- Ne menjaj podatke u bazi bez pitanja Miloša.

## Posle izmene

1. Pokreni agenta **tester**.
2. Na laptopu otvori stranu duplim klikom i proveri je, uz internet jer se podaci učitavaju iz baze.
3. Commit u GitHub Desktop sa kratkim opisom šta je promenjeno.
