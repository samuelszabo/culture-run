# Level: Čína — Veľký čínsky múr

Prvý a v v1 jediný hrateľný level (interné id zostáva `china-bridge`). Slúži ako vzor pre všetky budúce levely — jeho štruktúra (dáta levelu, tematické prvky, odmena) sa bude opakovať.

## Prostredie

- **Miesto:** Veľký čínsky múr vedúci ponad zalesnené kopce
- **Paleta:** červená, zlatá, sivý kameň, lesná zelená pod múrom
- **Pozadie:** zalesnené kopce a hory v opare, strážne veže, lampióny na cimburí
- **Cesta:** kamenná dlažba múru s cimburím po stranách

## Parametre

| Parameter | Hodnota |
|---|---|
| Dĺžka behu | ~75 sekúnd |
| Štartová rýchlosť | základná, na konci +30 % |
| Životy | 3 |
| Odmena za 5★ | čínsky drak |

## Prekážky

| Prekážka | Typ | Správanie |
|---|---|---|
| Stánok s tovarom | statická | stojí, zaberá ~1/3 šírky cesty |
| Zvyšok múru | statická | nízky kamenný blok |
| Okoloidúci človek | pohyblivá | prechádza pomaly naprieč cestou |
| Nosič s košmi | pohyblivá | rýchlejší, mení smer |
| Petarda | vystreľujúca | 1 s varovanie (blikajúce miesto), potom výbuch — smrteľný kontakt |

Hustota prekážok rastie postupne: prvých ~15 s zľahka (zoznámenie), stred plynulo hustejšie, posledných ~15 s najťažších (kombinácie statická + pohyblivá).

Vždy musí existovať **prejditeľná cesta** — generovanie/rozmiestnenie nikdy nezablokuje celú šírku.

## Zbierateľné predmety

| Predmet | Body | Výskyt |
|---|---|---|
| Miska rezancov | +15 | menej časté, niekedy na riskantných miestach |
| Knedlička (baozi) | +15 | bežné |
| Šálka čaju | +10 | bežné, v radoch za sebou |

Predmety sú rozmiestnené v líniách a oblúkoch, ktoré vedú hráča bezpečnou cestou — ale najhodnotnejšie kúsky lákajú bližšie k prekážkam.

**Maximálne skóre M** = súčet všetkých predmetov na trati (cieľ ~1000 bodov). Prahy hviezdičiek a penalizácia za smrť sa počítajú z M (pozri game-design.md).

## Vzdelávací prvok

- Pred štartom levelu krátka kartička: vlajka Číny + 1–2 vety o mieste („Veľký čínsky múr sa staval viac ako 2 000 rokov...")
- Na vyhodnocovacej obrazovke zaujímavosť o jedle, ktoré hráč zbieral
