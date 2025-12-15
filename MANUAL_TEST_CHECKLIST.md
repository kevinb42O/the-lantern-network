# 🏮 The Lantern Network - Handmatige Test Checklist

**Tester:** _________________ **Datum:** _________________

---

## 1. AUTHENTICATIE & ONBOARDING

### Splash Screen
- [ ] Geanimeerd lantaarn logo wordt correct weergegeven
- [ ] "The Neighborhood That Moves With You" tagline verschijnt
- [ ] Soepele overgang naar hoofdapp na animatie

### Inloggen
- [ ] Inlogpagina laadt correct
- [ ] E-mailveld accepteert invoer
- [ ] Wachtwoordveld accepteert invoer (gemaskeerd)
- [ ] Inloggen met geldige gegevens werkt
- [ ] Inloggen met ongeldige gegevens toont foutmelding
- [ ] Magic link (wachtwoordloos) inloggen werkt
- [ ] Sessie blijft behouden na pagina vernieuwen

### Registratie
- [ ] Aanmeldformulier laadt correct
- [ ] E-mailvalidatie werkt
- [ ] Wachtwoordvereisten worden afgedwongen
- [ ] Account aanmaken succesvol
- [ ] Startsaldo is 5 Lichtpuntjes

### Uitloggen
- [ ] Uitlogknop zichtbaar in profiel
- [ ] Uitloggen logt gebruiker succesvol uit
- [ ] Doorgestuurd naar inlogscherm na uitloggen

---

## 2. PROFIEL SYSTEEM

### Profiel Aanmaken (Nieuwe Gebruikers)
- [ ] Profiel aanmaakscherm verschijnt voor nieuwe gebruikers
- [ ] Kan weergavenaam invoeren
- [ ] Kan bio invoeren
- [ ] Kan 1-5 vibe tags selecteren (vaardigheden/interesses)
- [ ] Profiel wordt succesvol opgeslagen

### Profiel Bekijken
- [ ] Profielfoto wordt weergegeven
- [ ] Weergavenaam toont correct
- [ ] Bio wordt correct weergegeven
- [ ] Vibe tags worden correct weergegeven
- [ ] Trust score/reputatie wordt getoond
- [ ] Aantal keer geholpen wordt accuraat weergegeven
- [ ] Buurheld badge toont wanneer trust_score >= 100

### Vibe Card
- [ ] Gebruikersinfo wordt weergegeven
- [ ] Reputatie/trust score zichtbaar
- [ ] Vaardigheden/vibe tags getoond
- [ ] Buurheld status indicator (indien van toepassing)

---

## 3. NAVIGATIE

### Onderste Tab Balk
- [ ] Lichtjes tab bereikbaar
- [ ] Kampvuur tab bereikbaar
- [ ] Portemonnee tab bereikbaar
- [ ] Berichten tab bereikbaar
- [ ] Profiel tab bereikbaar
- [ ] Actieve tab correct gemarkeerd
- [ ] Ongelezen badges worden weergegeven op tabs (indien van toepassing)

---

## 4. LICHTJES (HULPVERZOEKEN)

### Lichtjes Bekijken
- [ ] Lichtjes lijst/feed laadt
- [ ] Lichtje kaarten worden correct weergegeven
- [ ] Categorie iconen tonen (Mechanisch, Eten, Praten, Anders)
- [ ] Filter tabs werken correct
- [ ] Verzoek vs Aanbod types zijn te onderscheiden
- [ ] Alleen-voor-buurt zichtbaarheid werkt (indien van toepassing)
- [ ] Realtime updates werken

### Lichtje Aanmaken
- [ ] "Lichtje Aanmaken" knop bereikbaar
- [ ] Aanmaak modal opent
- [ ] Kan titel/beschrijving invoeren
- [ ] Kan categorie selecteren: 
  - [ ] Mechanisch
  - [ ] Eten
  - [ ] Praten
  - [ ] Anders
- [ ] Kan Verzoek of Aanbod type kiezen
- [ ] Kan alleen-voor-buurt zichtbaarheid instellen
- [ ] Lichtje wordt succesvol geplaatst
- [ ] Nieuw lichtje verschijnt in lijst

### Reageren op Lichtjes
- [ ] "Bied Hulp Aan" knop zichtbaar op andermans lichtjes
- [ ] Klikken opent hulpaanbod flow
- [ ] Notificatie verstuurd naar lichtje maker

---

## 5. KAMPVUUR (COMMUNITY CHAT)

### Berichten Bekijken
- [ ] Kampvuur chat laadt
- [ ] Recente berichten worden weergegeven
- [ ] Berichten gesorteerd op tijd
- [ ] Tijdstempels tonen correct ("zojuist", "5m geleden", "2u geleden")
- [ ] Oudere berichten vervagen/tonen visuele veroudering
- [ ] Admin badges worden weergegeven bij admin berichten
- [ ] Realtime updates werken

### Berichten Versturen
- [ ] Berichtinvoerveld bereikbaar
- [ ] Kan bericht typen
- [ ] Verstuurknop werkt
- [ ] Bericht verschijnt direct na versturen
- [ ] Bericht zichtbaar voor alle gebruikers

---

## 6. PORTEMONNEE & LICHTPUNTJES ECONOMIE

### Saldo Weergave
- [ ] Huidig Lichtpuntjes saldo wordt getoond
- [ ] Voortgangsbalk toont (max 10)
- [ ] Hamsterlimiet indicator zichtbaar
- [ ] Saldo overschrijdt nooit 10

### Transactiegeschiedenis
- [ ] Transactiegeschiedenis lijst laadt
- [ ] Transacties tonen verzender/ontvanger
- [ ] Transacties tonen bedrag
- [ ] Transacties tonen datum/tijd
- [ ] Alle transacties correct gelogd

### Lichtpuntjes Overdrachten
- [ ] Kan overdracht starten na helpen
- [ ] Ontvanger selecteren werkt
- [ ] Overdracht bevestigen werkt
- [ ] Saldo wordt direct bijgewerkt
- [ ] Transactie wordt vastgelegd

---

## 7. BERICHTEN (1-OP-1 GESPREKKEN)

### Hulpverzoek Gesprekken
- [ ] Gesprekkenlijst laadt
- [ ] Kan gesprek openen
- [ ] Berichten worden correct weergegeven
- [ ] Kan berichten versturen
- [ ] Realtime berichtaflevering
- [ ] Accepteer hulpaanbod knop werkt
- [ ] Weiger hulpaanbod knop werkt

### Buurt DMs
- [ ] Buurt DM tab bereikbaar
- [ ] Kan buurtberichten bekijken
- [ ] Kan buurtberichten versturen

### Tab Navigatie
- [ ] Hulpverzoeken tab werkt
- [ ] Buurt DMs tab werkt
- [ ] Tab wisselen werkt correct

### Hulpverzoek Workflow
- [ ] Accepteer knop werkt
- [ ] Weiger knop werkt
- [ ] "Markeer als Voltooid" workflow:
  - [ ] Voltooi lichtje knop bereikbaar
  - [ ] Kan Lichtpuntjes bedrag selecteren om te versturen
  - [ ] Voltooiing werkt lichtje status bij
  - [ ] Lichtpuntjes correct overgedragen

### Ongelezen Indicatoren
- [ ] Ongelezen badge toont op Berichten tab
- [ ] Ongelezen aantal is accuraat
- [ ] Als gelezen markeren verwijdert badge

---

## 8. BUURHELD SYSTEEM

### Buurheld Status
- [ ] Buurheld badge wordt weergegeven wanneer trust_score >= 100
- [ ] Buurheld status zichtbaar op profiel
- [ ] Buurheld-exclusieve functies bereikbaar voor Buurhelden

### Trust Score
- [ ] Trust score stijgt bij anderen helpen (+10)
- [ ] Trust score stijgt bij hulp ontvangen (+5)
- [ ] Score wordt accuraat weergegeven

### Uitnodigingscodes (Alleen Buurhelden)
- [ ] Genereer uitnodiging knop zichtbaar voor Buurhelden
- [ ] Kan nieuwe uitnodigingscodes genereren
- [ ] Uitnodigingscodes worden correct weergegeven
- [ ] Kopiëren naar klembord werkt
- [ ] Codes kunnen worden gedeeld

---

## 9. BUURT / VERTROUWENSNETWERK

- [ ] Buurtverbindingen worden weergegeven
- [ ] Kan buurtleden bekijken
- [ ] Buurt chat bereikbaar
- [ ] Alleen-voor-buurt lichtjes zichtbaar voor buurt

---

## 10. VERHALEN

- [ ] Verhalen tab/weergave bereikbaar
- [ ] Kan nieuw verhaal aanmaken
- [ ] Verhalen worden correct weergegeven
- [ ] Verhaal vervaldatum werkt (48 uur)
- [ ] Reacties op verhalen werken: 
  - [ ] Hart reactie
  - [ ] Vier reactie
  - [ ] Thuis reactie

---

## 11. NOTIFICATIES & AANKONDIGINGEN

- [ ] Ongelezen badges worden correct weergegeven
- [ ] Aankondigingen zichtbaar
- [ ] Notificatie aantal accuraat
- [ ] Klikken op notificatie navigeert correct

---

## 12. BEHEER PANEEL (Alleen Admin Gebruikers)

- [ ] Beheer paneel bereikbaar voor admin gebruikers
- [ ] Beheer navigatieknop zichtbaar
- [ ] Statistieken weergave laadt
- [ ] Gebruikersbeheer bereikbaar
- [ ] Kan aankondigingen versturen
- [ ] Aankondiging aflevering werkt
- [ ] Kan lichtjes verwijderen
- [ ] Kan kampvuur legen

---

## 13. MODERATOR PANEEL (Alleen Moderators)

- [ ] Moderator paneel bereikbaar voor moderators
- [ ] Moderator navigatieknop zichtbaar (cyaan kleur)
- [ ] Kan lichtjes verwijderen
- [ ] Kan kampvuur legen

---

## 14. ALGEMENE UI/UX

- [ ] Alle animaties soepel
- [ ] Geen layout problemen
- [ ] Responsief op mobiel
- [ ] Donker thema consistent
- [ ] Alle knoppen klikbaar
- [ ] Geen console fouten
- [ ] Laadstatussen worden weergegeven
- [ ] Toast meldingen werken correct

---

## 15. FOUTAFHANDELING

- [ ] Netwerkfout berichten worden weergegeven
- [ ] Formulier validatiefouten getoond
- [ ] Lege states netjes afgehandeld
- [ ] Opnieuw proberen opties beschikbaar waar nodig

---

## OPMERKINGEN

_Gebruik deze ruimte voor extra observaties:_

```
__________________________________________________________
__________________________________________________________
__________________________________________________________
__________________________________________________________
__________________________________________________________
__________________________________________________________
__________________________________________________________
__________________________________________________________
```

---

## GEVONDEN BUGS

| # | Beschrijving | Ernst (Hoog/Midden/Laag) | Scherm |
|---|--------------|--------------------------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |

---

**Testen Voltooid:** [ ] Ja / [ ] Nee

**Algemene Status:** ⬜ Geslaagd / ⬜ Gefaald / ⬜ Gedeeltelijk

**Handtekening:** _________________
