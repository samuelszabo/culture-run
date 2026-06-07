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

### Fáza 2 — herný obsah
- [ ] Zbierateľné predmety + skóre
- [ ] Pohyblivé a vystreľujúce prekážky
- [ ] Level Čína — most: dáta trate, stúpajúca náročnosť, cieľová čiara
- [ ] Hviezdičky (prahy z M), penalizácia za smrť
- [ ] HUD: skóre, srdiečka, progress bar

### Fáza 3 — obrazovky a progres
- [ ] Úvodná obrazovka, výber postavičky (chlapec/dievča)
- [ ] Výber krajiny (vlajky — Čína odomknutá, ostatné „čoskoro") a oblasti
- [ ] Vyhodnotenie: animované hviezdičky, odmena za 5★
- [ ] Šatník: trblietavý chvost (odomykateľný), labubu vzhľad ako zamknutá ukážka, zapínanie/vypínanie
- [ ] localStorage: ukladanie progresu, odmien a nastavení

### Fáza 4 — vizuál a vyladenie
- [ ] Parallax pozadie Číny, farebná paleta, lampióny, pagody
- [ ] Animácie postavičky (beh, smrť, oslava), častice (zber, chvost, konfety)
- [ ] Vzdelávacie kartičky (pred levelom, po leveli)
- [ ] Balansovanie: rozmiestnenie predmetov a prekážok tak, aby 5★ bolo náročné ale férové
- [ ] Test na reálnom mobile, výkon 60 fps, nasadenie na statický hosting

## Verzia 2 — rozšírenie

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
