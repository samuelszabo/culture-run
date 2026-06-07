# Culture Run — herný dizajn

## Koncept

**Culture Run** je behačka (runner) pre prehliadač, v ktorej hráč spoznáva krajiny sveta. Vyberie si krajinu podľa vlajky, potom zaujímavú oblasť z tejto krajiny (napr. čínsky most) a postavička beží smerom hore cez túto oblasť — vyhýba sa prekážkam a zbiera miestne jedlo a vodu. Na konci levelu dostane hodnotenie 1–5 hviezdičiek. Za 5 hviezdičiek získa odmenu — kozmetické vylepšenie postavičky.

- **Cieľová skupina:** deti 8–12 rokov
- **Platforma:** prehliadač — počítač aj mobil, bez backendu
- **Jazyk:** slovenčina (angličtina neskôr)
- **Vzdelávací rozmer:** každý level predstavuje skutočné miesto z danej krajiny

## Herná slučka

1. **Výber postavičky** — chlapec alebo dievča (hranatá, jednoduchá postavička)
2. **Výber krajiny** — obrazovka s vlajkami (v1: odomknutá iba Čína, ostatné „čoskoro")
3. **Výber oblasti** — zaujímavé miesto z krajiny (v1: čínsky most)
4. **Beh** — postavička beží automaticky smerom hore, hráč ju ovláda do strán
5. **Vyhodnotenie** — hviezdičky, skóre, prípadná odmena
6. **Opakovanie** — hráč skúša level znova, kým nezíska 5 hviezdičiek

## Beh

- Postavička beží **automaticky smerom hore**, rýchlosť sa počas levelu mierne zvyšuje
- Hráč ovláda **voľný plynulý pohyb doľava/doprava** po celej šírke cesty
- Dĺžka levelu: **60–90 sekúnd** (pevná dĺžka trate, koniec je cieľová čiara)

### Prekážky

| Typ | Príklady (Čína) | Správanie |
|---|---|---|
| Statické | stánky, zvyšky múru, lampióny na zemi | stoja na mieste |
| Pohyblivé | ľudia prechádzajúci cez cestu | pohybujú sa do strán |
| Vystreľujúce | petardy, vyskakujúce prvky | objavia sa s krátkym varovaním, potom vystrelia |

### Zbierateľné predmety

| Predmet | Body | Poznámka |
|---|---|---|
| Jedlo | +15 | tematické pre krajinu (Čína: rezance, knedličky, ryža) |
| Voda / nápoj | +10 | Čína: čaj |

### Smrť a životy

- Náraz do prekážky = **smrť**: postavička sa zastaví, krátka animácia, **odpočítajú sa body** (pozri nižšie), po 1–2 sekundách beží ďalej z toho istého miesta
- Hráč má **3 životy** — po 3. smrti level končí predčasne (vyhodnotí sa dosiahnuté skóre)
- Po smrti je postavička 2 sekundy **nesmrteľná** (bliká), aby nenarazila hneď znova

## Skóre a hviezdičky

Všetko sa počíta v bodoch. Hviezdičky sú prahy z **maximálneho možného skóre levelu (M)** — súčet bodov všetkých zbierateľných predmetov na trati.

- **Penalizácia za smrť: −15 % z M** (skóre nemôže klesnúť pod 0)

| Hviezdičky | Výsledné skóre |
|---|---|
| ★★★★★ | ≥ 90 % M |
| ★★★★ | ≥ 75 % M |
| ★★★ | ≥ 55 % M |
| ★★ | ≥ 35 % M |
| ★ | dobehnutie do cieľa |

Z toho vyplýva:
- **Jedna smrť matematicky vylučuje 5 hviezdičiek** (max. dosiahnuteľné je 85 % M) — presne podľa pravidla „po smrti už nedostane plných 5 hviezdičiek"
- Na 5 hviezdičiek treba pozbierať takmer všetko a nezomrieť ani raz

## Odmeny a vylepšenia

Odmenu hráč získa **iba za 5 hviezdičiek** v leveli. Odmeny sú kozmetické vylepšenia postavičky:

- **Čínsky drak** — vlniaci sa dračí chvost za postavičkou počas behu (odmena za Čínu — most)
- **Labubu vzhľad** — postavička vyzerá ako labubu (uši, zúbky); v šatníku viditeľný od začiatku ako zamknutá ukážka, odomkne ho druhý level (v2)
- ďalšie pribudnú s novými levelmi (každý level = jedna unikátna odmena)

Vylepšenia sa aplikujú **na základnú postavičku** (chlapec/dievča) a dajú sa kombinovať. Hráč si ich zapína/vypína v šatníku na úvodnej obrazovke. Odomknuté vylepšenia zostávajú uložené v zariadení. Zamknuté vylepšenia sú v šatníku viditeľné sivé so zámkom — motivácia hrať ďalej.

## Postavička

- Hranatá, jednoduchá (štýl voxel/Minecraft-like, ale 2D)
- Výber: chlapec alebo dievča
- Animácia behu (striedanie nôh), smrti (spadnutie/zablikanie), oslavy v cieli
- Kozmetické vylepšenia sa vykresľujú ako vrstvy na postavičke

## Grafika a atmosféra

- Veselé, sýte farby vhodné pre deti
- Každá krajina má vlastnú farebnú paletu a tematické prvky (Čína: červená/zlatá, lampióny, pagody v pozadí)
- Pozadie sa posúva (parallax) pre dojem hĺbky
- Jednoduché časticové efekty: zber predmetu, smrť, dračí chvost, konfety v cieli

## Zvuk (v1 voliteľné, v2 isté)

- Tematická hudba na pozadí podľa krajiny
- Zvuky: zber predmetu, náraz, cieľ, hviezdičky
- Tlačidlo na vypnutie zvuku

## Obrazovky

1. **Úvodná** — logo, tlačidlá Hrať / Šatník / Nastavenia
2. **Výber postavičky** — chlapec / dievča (iba pri prvom spustení, potom v šatníku)
3. **Výber krajiny** — mriežka vlajok, zamknuté krajiny sivé so zámkom
4. **Výber oblasti** — karty oblastí krajiny s obrázkom
5. **Hra** — beh, HUD: skóre, životy (3 srdiečka), priebeh levelu (progress bar)
6. **Vyhodnotenie** — hviezdičky (animované postupné rozsvietenie), skóre, odmena (ak 5★), tlačidlá Znova / Domov
7. **Šatník** — postavička s odomknutými vylepšeniami, zapínanie/vypínanie
