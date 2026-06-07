# Culture Run — plán vývoja

## Verzia 1 (MVP) — Čína, jeden level

Cieľ: hrateľná, pekná, kompletná slučka s jedným levelom. Všetko ostatné počká.

### Fáza 1 — základ hry ✅
- [x] Projekt: Vite + TypeScript, štruktúra priečinkov, i18n so `sk.json`
- [x] Game loop (fixed timestep), škálovanie canvasu, portrait layout
- [x] Postavička: pohyb do strán, klávesnica (šípky + AWSD)
- [x] Dotykové ovládanie (drag-to-move)
- [x] Posúvajúca sa trať so statickými prekážkami, AABB kolízie
- [x] Smrť, 3 životy, nesmrteľnosť po smrti, koniec po 3 smrtiach

### Fáza 2 — herný obsah ✅
- [x] Zbierateľné predmety + skóre
- [x] Pohyblivé a vystreľujúce prekážky
- [x] Level Čína — most: dáta trate, stúpajúca náročnosť, cieľová čiara
- [x] Hviezdičky (prahy z M), penalizácia za smrť
- [x] HUD: skóre, srdiečka, progress bar

### Fáza 3 — obrazovky a progres ✅
- [x] Úvodná obrazovka, výber postavičky (chlapec/dievča)
- [x] Výber krajiny (vlajky — Čína odomknutá, ostatné „čoskoro") a oblasti
- [x] Vyhodnotenie: animované hviezdičky, odmena za 5★
- [x] Šatník: čínsky drak (odomykateľný), labubu vzhľad ako zamknutá ukážka, zapínanie/vypínanie
- [x] localStorage: ukladanie progresu, odmien a nastavení

### Fáza 4 — vizuál a vyladenie ✅
- [x] Parallax pozadie Číny, farebná paleta, lampióny, pagody (les pod múrom, cimburie, lampióny)
- [x] Animácie postavičky (beh, smrť, oslava), častice (zber, chvost, konfety)
- [x] Vzdelávacie kartičky (pred levelom, po leveli)
- [x] Balansovanie: simuláciou overené — 5★ dosiahnuteľné (0 smrtí + 92 % zberu), 1 smrť → max 4★
- [ ] Test na reálnom mobile a zapnutie GitHub Pages (workflow pripravený — Settings → Pages → Source: GitHub Actions)

## Verzia 2 — 3D redizajn (docs/redesign-3d.md)

### Fáza 5 — 3D základ (Three.js) ✅
- [x] Scéna: kamera za postavičkou, svetlá, hmla, prostredie Veľkého čínskeho múru (les, kopce, cimburie, strážne veže, lampióny)
- [x] 3D postavička (chlapec/dievča), animácie behu/smrti/oslavy, kozmetika (drak, labubu)
- [x] Prekážky a jedlá ako 3D meshe synchronizované z hernej logiky
- [x] HUD a výsledkovka v DOM overlay
- [x] Plne hrateľné v 3D, logika nezmenená (sim stále platí: 0 smrtí + 92 % = 5★)

### Fáza 6 — skutočné assety a pamiatky ✅
- [x] CC0 modely jedál (miska polievky, šálka čaju, bambusový parník — Kenney Food Kit) + ATTRIBUTION.md; pagoda a lev z geometrie (CC0 GLB neexistuje)
- [x] Pamiatky popri trati s titulkami a faktami (strážna veža, pagoda, kamenné levy)

### Fáza 7 — edukácia
- [ ] Názvy jedál pri zbere
- [ ] Album / zbierka s faktami (localStorage)
- [ ] Kvíz po leveli za bonusové body

### Fáza 8 — polish a vydanie
- [ ] Výkon na mobile (60 fps), kvalita podľa zariadenia
- [ ] Nasadenie novej verzie

## Verzia 3 — rozšírenie

- Druhý level Číny (napr. Veľký čínsky múr) alebo druhá krajina (hlasovanie v rodine 🙂) — odomkne labubu vzhľad
- Angličtina (`en.json` + prepínač jazyka)
- Zvuky a hudba
- PWA: inštalácia na plochu mobilu, offline hranie
- Ďalšie odmeny (každý level jedna unikátna)

## Neskôr (nápady, nezáväzné)

- Viac krajín: Japonsko, Egypt, Taliansko, Slovensko...
- Viac oblastí na krajinu (3 levely = krajina „dokončená")
- Denná výzva, rebríček najlepších skóre na zariadení
- Kvízová otázka o krajine po leveli za bonusové body

## Zámerne mimo rozsahu

- Backend, účty, synchronizácia medzi zariadeniami
- Multiplayer
- Nákupy / monetizácia
