// =============================================================
//  PRODAVNICA GUMA: pretraga, rezervacija i provera dostupnosti
// =============================================================

nacrtajZaglavlje("Gume");
nacrtajPodnozje();

const NAZIV_SEZONE = { letnja: "Letnja", zimska: "Zimska", "sve sezone": "Sve sezone" };
const KLASA_SEZONE = { letnja: "sezona-letnja", zimska: "sezona-zimska", "sve sezone": "sezona-sve" };

const raspon = (od, doo, korak) => Array.from({ length: Math.floor((doo - od) / korak) + 1 }, (_, i) => od + i * korak);
const parametri = new URLSearchParams(location.search);

function popuniIzbor(id, vrednosti, prazno) {
  const el = document.getElementById(id);
  el.innerHTML = `<option value="">${prazno}</option>` + vrednosti.map((v) => `<option value="${v}">${v}</option>`).join("");
  if (parametri.get(el.name)) el.value = parametri.get(el.name);
}

popuniIzbor("f-sirina", raspon(125, 355, 10), "Sve");
popuniIzbor("f-visina", raspon(25, 85, 5), "Sve");
popuniIzbor("f-precnik", raspon(12, 24, 1), "Svi");
["sezona", "tip"].forEach((p) => { if (parametri.get(p)) document.getElementById("f-" + p).value = parametri.get(p); });
document.getElementById("u-lokacija").innerHTML = opcijeLokacija();

let gume = [];

// Proizvođači iz baze, za padajući meni
async function ucitajProizvodjace() {
  const { data } = await baza.from("gume").select("proizvodjac");
  const imena = [...new Set((data || []).map((g) => g.proizvodjac))].sort();
  const el = document.getElementById("f-proizvodjac");
  el.innerHTML = `<option value="">Svi</option>` + imena.map((i) => `<option>${esc(i)}</option>`).join("");
  if (parametri.get("proizvodjac")) el.value = parametri.get("proizvodjac");
}

function izabraniFilteri() {
  const f = {};
  ["sirina", "visina", "precnik", "sezona", "tip", "proizvodjac"].forEach((p) => {
    const v = document.getElementById("f-" + p).value;
    if (v) f[p] = v;
  });
  return f;
}

async function pretrazi() {
  const f = izabraniFilteri();
  const info = document.getElementById("info");
  info.textContent = "Učitavam gume…";

  let upit = baza.from("gume").select("*").order("cena", { ascending: true });
  Object.entries(f).forEach(([k, v]) => { upit = upit.eq(k, v); });
  const { data, error } = await upit;

  if (error) {
    info.textContent = "";
    document.getElementById("lista").innerHTML = `<div class="poruka-greska">Gume trenutno ne mogu da se učitaju. Pozovite nas na ${esc(K.lokacije[0].telefoni[0])}.</div>`;
    return;
  }
  gume = data;
  prikazi(f);
}

function dimenzija(g) { return `${g.sirina}/${g.visina} R${g.precnik}`; }

function prikazi(f) {
  const lista = document.getElementById("lista");
  const info = document.getElementById("info");

  if (!gume.length) {
    info.textContent = "";
    const trazena = f.sirina && f.visina && f.precnik ? `${f.sirina}/${f.visina} R${f.precnik}` : null;
    lista.innerHTML = `
      <div class="prazno">
        <h3>${trazena ? `Za ${esc(trazena)} nemamo gume na sajtu` : "Nema guma za izabrane filtere"}</h3>
        <p>Imamo preko 10.000 artikala, a ne nalaze se svi na sajtu. Pošaljite upit i javićemo vam šta možemo da nabavimo i po kojoj ceni.</p>
        <button class="dugme dugme-zuto" type="button" id="upit-dimenzija">Pitaj za ${trazena ? esc(trazena) : "ovu gumu"}</button>
      </div>`;
    document.getElementById("upit-dimenzija").addEventListener("click", () =>
      otvoriProzor("dostupnost", null, trazena));
    return;
  }

  info.textContent = `Pronađeno guma: ${gume.length}`;
  lista.innerHTML = gume.map((g) => {
    const naStanju = g.kolicina > 0;
    return `
      <article class="guma-red">
        <div class="guma-slika">${slikaIliIkona(g.slika_url, `${g.proizvodjac} ${g.model}`)}</div>
        <div>
          <div class="guma-dimenzija">${esc(dimenzija(g))}</div>
          <div class="guma-naziv">${esc(g.proizvodjac)} ${esc(g.model)}</div>
          <div class="guma-detalji">
            <span class="oznaka-sezone ${KLASA_SEZONE[g.sezona] || ""}">${esc(NAZIV_SEZONE[g.sezona] || g.sezona)}</span>
            ${g.indeks ? `Indeks ${esc(g.indeks)}` : ""}
          </div>
        </div>
        <div class="guma-cena-kol">
          <div class="cena-velika">${g.cena !== null ? esc(cena(g.cena)) : "Cena na upit"}</div>
          <div class="guma-detalji">po komadu</div>
        </div>
        <div class="guma-akcije">
          <span class="stanje ${naStanju ? "stanje-da" : "stanje-ne"}">${naStanju ? `Na stanju: ${g.kolicina} kom` : "Trenutno nije na stanju"}</span>
          <div class="dugmad">
            ${naStanju ? `<button class="dugme dugme-zuto dugme-malo" data-rezervisi="${g.id}">Rezerviši</button>` : ""}
            <button class="dugme dugme-okvir dugme-malo" data-dostupnost="${g.id}">Proveri dostupnost</button>
          </div>
        </div>
      </article>`;
  }).join("");
}

// ---------- Prozor za upit ----------
const prozor = document.getElementById("prozor");
let trenutniUpit = null;

function otvoriProzor(tip, guma, trazenaDimenzija) {
  trenutniUpit = { tip, guma, trazenaDimenzija };
  const rez = tip === "rezervacija";
  document.getElementById("prozor-naslov").textContent = rez ? "Rezervacija guma" : "Provera dostupnosti";
  document.getElementById("u-posalji").textContent = rez ? "Pošalji rezervaciju" : "Pošalji upit";
  document.getElementById("u-posalji").disabled = false;
  document.getElementById("u-status").innerHTML = "";

  const kol = document.getElementById("u-kolicina");
  if (guma && rez) {
    [...kol.options].forEach((o) => { o.disabled = Number(o.value) > guma.kolicina; });
    if (Number(kol.value) > guma.kolicina) kol.value = [...kol.options].filter((o) => !o.disabled).pop().value;
  } else {
    [...kol.options].forEach((o) => { o.disabled = false; });
  }

  document.getElementById("izabrano").innerHTML = guma
    ? `<strong>${esc(dimenzija(guma))}</strong> · ${esc(guma.proizvodjac)} ${esc(guma.model)}<br>${guma.cena !== null ? esc(cena(guma.cena)) + " po komadu" : "Cena na upit"}`
    : `<strong>${esc(trazenaDimenzija || "Guma po vašem izboru")}</strong><br>Proverićemo šta možemo da nabavimo.`;

  prozor.showModal();
  document.getElementById("u-ime").focus();
}

document.getElementById("lista").addEventListener("click", (e) => {
  const r = e.target.closest("[data-rezervisi]");
  const d = e.target.closest("[data-dostupnost]");
  if (r) otvoriProzor("rezervacija", gume.find((g) => g.id == r.dataset.rezervisi));
  if (d) otvoriProzor("dostupnost", gume.find((g) => g.id == d.dataset.dostupnost));
});

prozor.querySelector("[data-zatvori]").addEventListener("click", () => prozor.close());

document.getElementById("forma-upita").addEventListener("submit", async (e) => {
  e.preventDefault();
  const dugme = document.getElementById("u-posalji");
  const status = document.getElementById("u-status");
  dugme.disabled = true;
  status.innerHTML = "";

  const { tip, guma, trazenaDimenzija } = trenutniUpit;
  const kolicina = Number(document.getElementById("u-kolicina").value);
  const stavka = guma
    ? { guma_id: guma.id, naziv: `${dimenzija(guma)} ${guma.proizvodjac} ${guma.model}`, cena: guma.cena, kolicina }
    : { naziv: trazenaDimenzija || "Guma po izboru kupca", kolicina };

  try {
    await posaljiUpit({
      tip,
      ime: document.getElementById("u-ime").value.trim(),
      telefon: document.getElementById("u-telefon").value.trim(),
      lokacija: document.getElementById("u-lokacija").value,
      poruka: document.getElementById("u-poruka").value.trim() || null,
      stavke: [stavka],
    });
    status.innerHTML = `<div class="poruka-ok">${tip === "rezervacija" ? "Rezervacija je poslata." : "Upit je poslat."} Zvaćemo vas na ${esc(document.getElementById("u-telefon").value)} u toku radnog vremena.</div>`;
    dugme.textContent = "Poslato";
    e.target.reset();
  } catch (err) {
    console.error(err);
    status.innerHTML = `<div class="poruka-greska">Slanje nije uspelo. Proverite ime i telefon, ili nas pozovite na ${esc(K.lokacije[0].telefoni[0])}.</div>`;
    dugme.disabled = false;
  }
});

document.getElementById("pretraga").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = izabraniFilteri();
  history.replaceState(null, "", "?" + new URLSearchParams(f).toString());
  pretrazi();
});

ucitajProizvodjace().then(pretrazi);
