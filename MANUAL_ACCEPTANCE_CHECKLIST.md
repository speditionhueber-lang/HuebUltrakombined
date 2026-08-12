# MANUELLE ABNAHME-CHECKLISTE (PILOTBETRIEB & PRODUKTIONSFREIGABE)

Diese Checkliste dient der strukturierten manuellen Abnahme der Anwendung **Spedition Hüber Studio** unter Staging- und Pilotbedingungen vor der finalen Freigabe.

---

## 1. Outlook & Kommunikation
- [ ] **Anmeldung & Token-Lifecycle:** Microsoft-Anmeldung im Outlook-Tab durchführen, Token-Gültigkeit prüfen.
- [ ] **E-Mail-Abruf:** Posteingang abrufen und E-Mails anzeigen.
- [ ] **E-Mail-Anzeige & Zuordnung:** E-Mail auswählen, automatische Case-Zuordnung prüfen.
- [ ] **Draftbearbeitung:** E-Mail-Antwortentwurf anpassen (Text, Empfänger).
- [ ] **Sicherer Versand:** Versand ausführen; prüfen, dass in Staging nur freigegebene Testempfänger kontaktiert werden.
- [ ] **Fehlerzustand:** Netzwerkausfall/Rate-Limit simulieren, Fehlermeldung und Retry-Button im Exception Center prüfen.

---

## 2. CRM & Kundendaten
- [ ] **Kunde anlegen:** Neuen Kunden manuell mit Adresse, Telefon & E-Mail anlegen.
- [ ] **Kunde bearbeiten:** Kundendaten aktualisieren.
- [ ] **Dublettenprüfung:** Kunden mit gleicher E-Mail anlegen; Exakten CRM-Treffer-Hinweis prüfen.
- [ ] **Adressvalidierung:** Abhol- und Zieladresse eingeben.
- [ ] **Löschschutz:** Kunden mit aktiven Vorgängen löschen; Schutzmeldung prüfen.

---

## 3. Angebot & Kalkulation
- [ ] **Kalkulation:** Umzugsvolumen (m³), Etagen, Trageentfernung & LKW-Anzahl eingeben.
- [ ] **Positionen & Rabatt:** Einzelpositionen hinzufügen, Rabatt und MwSt. (20%) prüfen.
- [ ] **Angebots-PDF:** Orientierungsangebot und verbindliches Angebot als PDF generieren und öffnen.
- [ ] **Kontrollierter Versand:** Angebotsmail prüfen und explizit freigeben.
- [ ] **Kundenannahme:** Kundenantwort erfassen und Annahme im Offer Response Review bestätigen.

---

## 4. Disposition & Planung
- [ ] **Kalenderansicht:** Termine im Dispositionsskalender einsehen.
- [ ] **Fahrzeugzuordnung:** LKW/Transporter der Tour zuweisen.
- [ ] **Mitarbeiterzuordnung:** Fahrer und Träger zuweisen.
- [ ] **Tourplanung:** Route und Zeitfenster prüfen.
- [ ] **Konflikterkennung:** Überbuchung simulieren; Warnhinweis prüfen.
- [ ] **Pufferzeiten:** Pufferzeiten zwischen Einsätzen verifizieren.

---

## 5. Einsatzvorbereitung & Durchführung
- [ ] **Vorbereitung:** Einsatzvorbereitungs-Review prüfen und Material/Packlisten freigeben.
- [ ] **Checklisten:** Packliste und Lieferschein erstellen.
- [ ] **Tatsächliche Zeiten:** Ist-Zeiten und Zusatzleistungen erfassen.
- [ ] **Vorfälle & Protokoll:** Schäden/Vorfälle im Einsatzprotokoll vermerken.
- [ ] **Abschluss:** Einsatz als durchgeführt markieren.

---

## 6. Abrechnung, Rechnung & Offene Posten
- [ ] **Rechnungsentwurf:** Rechnungsentwurf auf Basis durchgeführten Einsatzes prüfen.
- [ ] **Rechnungs-PDF:** Rechnungs-PDF erzeugen und Layout verifizieren.
- [ ] **Kontrollierter Versand:** Rechnungsversand explizit bestätigen.
- [ ] **Receivable/Offener Posten:** Offenen Posten im Finanzen-Tab prüfen.
- [ ] **Zahlungseingang:** Teilzahlung und Restzahlung verbuchen; Offenen Betrag prüfen.
- [ ] **Zahlungserinnerung:** Überfällige Rechnung prüfen, Erinnerungs-Entwurf generieren.

---

## 7. Automatisierung & Schutzschalter
- [ ] **Dry Run:** Automation im Simulation/Dry-Run-Modus testen.
- [ ] **Aktivierung:** Richtlinie aktivieren; automatisierte Entscheidungen prüfen.
- [ ] **Blockierung:** Nicht-freigegebenen externen Versand blockieren.
- [ ] **Rollback:** Triage-Entscheidung zurückrollen (Rollback-Button).
- [ ] **Policy-Pausierung:** Richtlinie bei Fehlern automatisch pausieren.

---

## 8. Persistenz, Offline & Sync
- [ ] **Reload Test:** Seite neu laden (`F5`); alle Daten und Status prüfen.
- [ ] **Offline Modus:** Netzwerk trennen; Daten im lokalen Cache bearbeiten.
- [ ] **Reconnect & Sync:** Netzwerk wiederherstellen; automatische Flushatktion verifizieren.
- [ ] **Gerätewechsel:** Aus Export-Backup wiederherstellen; Vorgänge & Dokumente verifizieren.
- [ ] **Dokumentdownload:** Gespeicherte PDFs herunterladen und Ansicht prüfen.

---

## Sign-off / Abnahmeerklärung

- **Abgenommen von:** ___________________________
- **Datum:** ___________________________
- **Status:** [ ] FREIGEGEBEN FOR PRODUKTION / [ ] IN NACHARBEIT
