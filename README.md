# Faktury

Jednoduchá česká fakturace v prohlížeči. Hodí se pro drobného podnikatele, který chce vystavit doklad, stáhnout PDF s QR platbou a nemít k tomu server.

Aplikace je statická. Běží na GitHub Pages a data se nikam neposílají.

## Co umí

- Profil dodavatele: název, adresa, IČO, DIČ, plátce nebo neplátce DPH, účet, IBAN, BIC, e-mail, telefon a volitelné logo.
- Adresář odběratelů. Podle IČO umí doplnit údaje z veřejného rejstříku [ARES](https://ares.gov.cz/), pokud to prohlížeč dovolí.
- Faktury s vlastní číselnou řadou (třeba `2026001`), datem vystavení, splatností a u plátce i datem uskutečnění zdanitelného plnění.
- Položky, sazby DPH 0 / 12 / 21 %, rekapitulaci a součet.
- Označení uhrazeno / neuhrazeno, hledání, filtr a duplikaci faktury.
- PDF i tisk. U bankovního převodu je na dokladu QR platba (formát SPD).
- Export a import všech dat v jednom souboru JSON.

## Data jsou jen u vás

Všechno se ukládá do `localStorage` v prohlížeči, ve kterém aplikaci otevřete. Není účet, není cloud a po vymazání historie prohlížeče data zmizí.

Než budete měnit telefon, mazat data prohlížeče nebo používat jiný prohlížeč, stáhněte zálohu v **Nastavení → Stáhnout zálohu**. Na druhém zařízení ji načtete tlačítkem **Načíst zálohu**. V souboru je i logo.

## Jak s tím pracovat

1. Otevřete **Dodavatel** a vyplňte údaje, které mají být na faktuře. Z čísla účtu ve tvaru `123456789/0800` jde dopočítat IBAN. Přepínač plátce DPH rozhodne, jestli doklad obsahuje daň.
2. V **Odběratelé** přidejte firmu. U IČO můžete zkusit **Načíst z ARES**. Když rejstřík neodpoví, údaje vyplňte ručně.
3. **Nová faktura** vezme další číslo z řady, doplní splatnost a po výběru odběratele jeho adresu. Položky mají množství, měrnou jednotku a cenu. U plátce i sazbu DPH.
4. Na detailu faktury je náhled dokladu. **Stáhnout PDF** uloží soubor, **Tisk** otevře dialog prohlížeče (na iPhonu přes něj jde uložit PDF do Souborů). **Duplikovat** založí nový doklad se stejným obsahem a novým číslem.
5. Vzor čísel (`{RRRR}{NNN}` a další) a výchozí splatnost jsou v **Nastavení**.

Doklad plátce je nadepsaný „Faktura – daňový doklad“ a obsahuje základ, sazbu, daň i datum uskutečnění zdanitelného plnění. U neplátce je na faktuře věta, že dodavatel není plátcem DPH, a daň se nepřičítá.

QR platba se skládá jen u bankovního převodu, platného IBAN a částky větší než nula. Řetězec je ve formátu ČBA `SPD*1.0*…` (účet, částka, měna CZK, splatnost, variabilní symbol).

Aplikace není účetní software a nenahrazuje radu účetní. Sazby a náležitosti odpovídají běžné faktuře a daňovému dokladu, jak se používají v Česku (sazby 12 % a 21 %).

## Vývoj na vlastním počítači

Potřebujete Node.js 20 nebo novější.

```bash
npm install
npm test
npm run dev
```

Vývojový server běží na `http://localhost:5173/`. Adresy v aplikaci jsou za znakem `#`, takže obnovení stránky funguje i na statickém hostingu.

```bash
npm run build
npm run preview
```

Sestavení skončí ve složce `dist`.

## Nasazení na GitHub Pages

Workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) se spustí při pushi do větve `main` (a také ručně). Nainstaluje závislosti, sestaví web a publikuje složku `dist`.

Základní cesta se při sestavení v Actions nastaví na `/<název-repozitáře>/`, malými písmeny. Lokálně zůstává `/`.

Aby se web opravdu zveřejnil:

1. V repozitáři otevřete **Settings → Pages**.
2. U **Build and deployment** nastavte **Source** na **GitHub Actions**.

U **soukromého** repozitáře GitHub Pages vyžaduje placený plán (GitHub Pro, Team nebo Enterprise). Workflow je připravené správně, publikace se ale zapne až po povolení Pages v nastavení a jen pokud to plán účtu dovolí. Veřejný repozitář Pages umí i na bezplatném plánu.

Po úspěšném nasazení je aplikace na `https://<účet>.github.io/<repozitář>/`.
