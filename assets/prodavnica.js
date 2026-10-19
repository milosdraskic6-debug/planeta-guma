// =============================================================
//  PRODAVNICA: artikli po kategorijama, korpa i porudžbina
// =============================================================

nacrtajZaglavlje("Prodavnica");
nacrtajPodnozje();

const KATEGORIJE = {
  ulja: "Ulja i filteri",
  akumulatori: "Akumulatori",
  felne: "Felne",
  delovi: "Delovi",
  oprema: "Oprema",
  usluge: "Usluge",
};

let artikli = [];
let izabranaKategorija = "";

// ---------- Korpa (pamti se u browseru kupca) ----------
let korpa = [];
try { korpa = JSON.parse(localStorage.getItem("pg-korpa") || "[]"); } catch { korpa = []; }

function sacuvajKorpu() {
  try { localStorage.setItem("pg-korpa", JSON.stringify(korpa)); } catch { /* browser ne dozvoljava, korpa radi do osvežavanja */ }
  const broj = korpa.reduce((s, x) => s + x.kolicina, 0);
  document.getElementById("korpa-broj").textContent = broj;
}

function dodajUKorpu(a) {
  const postoji = korpa.find((x) => x.id === a.id);
  if (postoji) postoji.kolicina += 1;
  else korpa.push({ id: a.id, naziv: a.naziv, cena: Number(a.cena), kolicina: 1 });
  sacuvajKorpu();
}

// ---------- Artikli ----------
async function ucitaj() {
  const { data, error } = await baza.from("proizvodi").select("*").order("kategorija").order("naziv");
  const info = document.getElementById("info");
  if (error) {
    info.innerHTML = `<span class="poruka-greska">Artikli trenutno ne mogu da se učitaju. Pozovite nas na ${esc(K.lokacije[0].telefoni[0])}.</span>`;
    return;
  }
  artikli = data;

  // Korpa je sačuvana u browseru, a firma je u međuvremenu možda promenila cenu
  // ili sklonila artikal. Uzimamo trenutne cene i izbacujemo ono čega više nema.
  korpa = korpa
    .map((x) => {
      const a = artikli.find((p) => p.id === x.id);
      return a && a.na_stanju && a.cena !== null ? { ...x, naziv: a.naziv, cena: Number(a.cena) } : null;
    })
    .filter(Boolean);
  sacuvajKorpu();

  nacrtajKategorije();
  prikazi();
}

function nacrtajKategorije() {
  const postojece = [...new Set(artikli.map((a) => a.kategorija))];
  const cipovi = [["", "Sve"], ...Object.entries(KATEGORIJE).filter(([k]) => postojece.includes(k))];
  const el = document.getElementById("kategorije");
  el.innerHTML = cipovi
    .map(([k, ime]) => `<button class="cip" type="button" data-kat="${k}" aria-pressed="${k === izabranaKategorija}">${esc(ime)}</button>`)
    .join("");
  el.onclick = (e) => {
    const b = e.target.closest("[data-kat]");
    if (!b) return;
    izabranaKategorija = b.dataset.kat;
    nacrtajKategorije();
    prikazi();
  };
}

function prikazi() {
  const lista = izabranaKategorija ? artikli.filter((a) => a.kategorija === izabranaKategorija) : artikli;
  document.getElementById("info").textContent = `Artikala: ${lista.length}`;

  document.getElementById("mreza").innerHTML = lista.map((a) => {
    const imaCenu = a.cena !== null;
    let akcija;
    if (!a.na_stanju) akcija = `<span class="stanje stanje-ne">Nije na stanju</span><button class="dugme dugme-okvir dugme-malo" data-pitaj="${a.id}">Pitaj</button>`;
    else if (imaCenu) akcija = `<span class="cena-velika">${esc(cena(a.cena))}</span><button class="dugme dugme-tamno dugme-malo" data-dodaj="${a.id}">Dodaj u korpu</button>`;
    else akcija = `<span class="cena-upit">Cena na upit</span><button class="dugme dugme-okvir dugme-malo" data-pitaj="${a.id}">Pitaj za cenu</button>`;

    return `
      <article class="artikal">
        <div class="artikal-slika">${slikaIliIkona(a.slika_url, a.naziv)}</div>
        <div class="artikal-telo">
          <span class="artikal-kat">${esc(KATEGORIJE[a.kategorija] || a.kategorija)}</span>
          <h3>${esc(a.naziv)}</h3>
          ${a.opis ? `<p class="artikal-opis">${esc(a.opis)}</p>` : ""}
          <div class="artikal-dno">${akcija}</div>
        </div>
      </article>`;
  }).join("");
}

document.getElementById("mreza").addEventListener("click", (e) => {
  const d = e.target.closest("[data-dodaj]");
  const p = e.target.closest("[data-pitaj]");
  if (d) {
    dodajUKorpu(artikli.find((a) => a.id == d.dataset.dodaj));
    d.textContent = "Dodato";
    setTimeout(() => { d.textContent = "Dodaj u korpu"; }, 1200);
    // Korpa poskoči da kupac vidi gde je artikal otišao
    const k = document.getElementById("korpa-dugme");
    k.classList.remove("poskok");
    void k.offsetWidth;
    k.classList.add("poskok");
  }
  if (p) otvoriPitanje(artikli.find((a) => a.id == p.dataset.pitaj));
});

// ---------- Prozor korpe ----------
const prozorKorpe = document.getElementById("korpa");
document.getElementById("p-lokacija").innerHTML = opcijeLokacija();

function nacrtajKorpu() {
  const el = document.getElementById("stavke");
  if (!korpa.length) {
    el.innerHTML = `<p>Korpa je prazna. Dodajte artikle iz prodavnice.</p>`;
    document.getElementById("p-posalji").disabled = true;
    return;
  }
  document.getElementById("p-posalji").disabled = false;
  const ukupno = korpa.reduce((s, x) => s + x.cena * x.kolicina, 0);
  el.innerHTML = korpa.map((x, i) => `
    <div class="stavka-korpe">
      <span>${esc(x.naziv)}<br><small>${esc(cena(x.cena))}</small></span>
      <span class="kolicina">
        <button type="button" data-manje="${i}" aria-label="Manje">−</button>
        <span>${x.kolicina}</span>
        <button type="button" data-vise="${i}" aria-label="Više">+</button>
      </span>
      <strong>${esc(cena(x.cena * x.kolicina))}</strong>
    </div>`).join("") + `<div class="ukupno"><span>Ukupno</span><span>${esc(cena(ukupno))}</span></div>`;
}

document.getElementById("stavke").addEventListener("click", (e) => {
  const m = e.target.closest("[data-manje]");
  const v = e.target.closest("[data-vise]");
  if (m) { const i = +m.dataset.manje; korpa[i].kolicina -= 1; if (korpa[i].kolicina < 1) korpa.splice(i, 1); }
  if (v) { korpa[+v.dataset.vise].kolicina += 1; }
  if (m || v) { sacuvajKorpu(); nacrtajKorpu(); }
});

document.getElementById("korpa-dugme").addEventListener("click", () => {
  document.getElementById("p-status").innerHTML = "";
  nacrtajKorpu();
  prozorKorpe.showModal();
});

document.getElementById("forma-porudzbine").addEventListener("submit", async (e) => {
  e.preventDefault();
  const dugme = document.getElementById("p-posalji");
  const status = document.getElementById("p-status");
  dugme.disabled = true;
  try {
    await posaljiUpit({
      tip: "porudzbina",
      ime: document.getElementById("p-ime").value.trim(),
      telefon: document.getElementById("p-telefon").value.trim(),
      email: document.getElementById("p-email").value.trim() || null,
      lokacija: document.getElementById("p-lokacija").value,
      poruka: document.getElementById("p-poruka").value.trim() || null,
      stavke: korpa.map((x) => ({ proizvod_id: x.id, naziv: x.naziv, cena: x.cena, kolicina: x.kolicina })),
    });
    korpa = [];
    sacuvajKorpu();
    document.getElementById("stavke").innerHTML = "";
    status.innerHTML = `<div class="poruka-ok">Porudžbina je poslata. Zvaćemo vas da potvrdimo kada možete da preuzmete artikle.</div>`;
    e.target.reset();
  } catch (err) {
    console.error(err);
    status.innerHTML = `<div class="poruka-greska">Slanje nije uspelo. Proverite ime i telefon, ili nas pozovite na ${esc(K.lokacije[0].telefoni[0])}.</div>`;
    dugme.disabled = false;
  }
});

// ---------- Prozor "Pitaj za cenu" ----------
const prozorPitanja = document.getElementById("pitanje");
let artikalPitanja = null;

function otvoriPitanje(a) {
  artikalPitanja = a;
  document.getElementById("pitanje-artikal").innerHTML = `<strong>${esc(a.naziv)}</strong>`;
  document.getElementById("q-status").innerHTML = "";
  document.getElementById("q-posalji").disabled = false;
  prozorPitanja.showModal();
  document.getElementById("q-ime").focus();
}

document.getElementById("forma-pitanja").addEventListener("submit", async (e) => {
  e.preventDefault();
  const dugme = document.getElementById("q-posalji");
  const status = document.getElementById("q-status");
  dugme.disabled = true;
  try {
    await posaljiUpit({
      tip: "dostupnost",
      ime: document.getElementById("q-ime").value.trim(),
      telefon: document.getElementById("q-telefon").value.trim(),
      poruka: document.getElementById("q-poruka").value.trim() || null,
      stavke: [{ proizvod_id: artikalPitanja.id, naziv: artikalPitanja.naziv, kolicina: 1 }],
    });
    status.innerHTML = `<div class="poruka-ok">Pitanje je poslato. Javićemo vam cenu telefonom.</div>`;
    e.target.reset();
  } catch (err) {
    console.error(err);
    status.innerHTML = `<div class="poruka-greska">Slanje nije uspelo. Pozovite nas na ${esc(K.lokacije[0].telefoni[0])}.</div>`;
    dugme.disabled = false;
  }
});

document.querySelectorAll("[data-zatvori]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));

sacuvajKorpu();
ucitaj();
