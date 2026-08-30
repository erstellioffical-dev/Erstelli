Erstelli V33

Rebranding: Website und Business-Helfer heißen jetzt durchgängig „Erstelli“. Der bisherige Funktionsumfang von V32 bleibt erhalten.

Erstelli V18

Fix: OpenAI Structured Outputs Schema für Erstelli korrigiert. Alle Objekt-Schemas verwenden additionalProperties:false; das Profil ist vollständig typisiert und nullable, damit die echte KI-Antwort nicht mehr mit dem Schemafehler abbricht.

BLUEPRINTLAB V15 – KI-DEMO

SCHNELLSTART
1. ZIP vollständig entpacken.
2. Doppelklick auf START_KI.bat.
3. Beim allerersten Start den OpenAI API-Key im schwarzen/blauen Fenster eingeben. Die Eingabe ist verborgen.
4. Der Key wird ausschließlich lokal in .env in diesem Ordner gespeichert.
5. Danach öffnet sich automatisch http://localhost:8787.
6. Das Serverfenster während des Tests offen lassen.

WICHTIG
- index.html NICHT direkt doppelklicken, wenn die echte KI verwendet werden soll.
- Der API-Key ist absichtlich NICHT im ZIP eingebettet. Ein veröffentlichter oder weitergegebener ZIP-Ordner würde sonst deinen kostenpflichtigen Schlüssel mit verteilen.
- Du musst den Key nur beim ersten Start lokal eingeben; danach bleibt er in .env gespeichert.
- Zum Wechseln des Keys: .env löschen und START_KI.bat erneut starten.

V15 ÄNDERUNGEN
- Ein-Klick-Start mit lokalem Key-Setup.
- Erstelli nutzt den Backend-Server, wenn unter localhost:8787 gestartet.
- Checkout/Generatorfenster ist kleiner, zentriert und innerhalb des sichtbaren Displays scrollbar.
- Auf kleinen Notebook-Displays wird das Fenster nach oben gesetzt und auf die verfügbare Höhe begrenzt.
- Fehlermeldung verweist jetzt auf START_KI.bat statt auf die alte Demo-Datei.

E-MAIL
Für echten E-Mail-Versand zusätzlich in .env setzen:
RESEND_API_KEY=...
FROM_EMAIL=...
Ohne diese beiden Werte wird der KI-Plan trotzdem direkt auf der Seite erstellt; nur E-Mail-Versand bleibt aus.

DATEIEN
- START_KI.bat – starten
- SETUP_AND_START_KI.ps1 – lokales Key-Setup + Serverstart
- server.js – KI-Backend
- index.html / styles.css / script.js – Webseite
- .env – entsteht lokal nach dem ersten Start


V18 – neue Preislogik
- 2,14,99 €, 5,14,99 €, 14,99 €; 14,99 € ist die absolute Obergrenze.
- Business Finder und Erstelli verwenden dieselbe serverseitige Empfehlungslogik.
- Der Server überschreibt eine abweichende KI-Preisempfehlung, damit Erstelli und Finder sich nicht widersprechen.
- Bank/Förderung ist in jeder Stufe möglich und kein automatischer Aufpreis.
- Die Generierung skaliert in Tiefe und Reasoning: Start (typisch 1–2 Min.), Plus (2–3 Min.), Pro (4–5 Min.). Die tatsächliche API-Laufzeit kann abweichen.


V18 PREMIUM-BLUEPRINT
- Jeder Plan wird auf hochwertige Ausgabe statt Schnelltext optimiert.
- Der Generator erstellt passende Business-Visuals über GPT-Image-2.
- 2,14,99 €: 2 Visuals; 5,14,99 €: 3 Visuals; 14,99 €: 4 Visuals.
- Jeder Businessplan enthält Executive Summary, Hauptplan, 4 Erfolgsfaktoren und einen 4-Wochen-Plan mit Checkboxen.
- Druckansicht ist als A4-PDF mit Cover, Seitenlayout und Footer vorbereitet.
- Bildgenerierung verursacht zusätzliche API-Kosten und kann die Erstellung um mehrere Minuten verlängern.


V22 PDF-Hinweis: Für eine vollständig saubere PDF im Browser-Druckdialog 'Kopf- und Fußzeilen' deaktivieren. Dadurch verschwinden localhost-URL und Browser-Seitenangaben. Der Businessplan selbst setzt keine wiederholte Fußzeile mehr; das Erstellungsdatum steht kompakt auf dem Cover.


V23: Businessplan-Erstellung ist gesperrt, bis der Business Finder vollständig abgeschlossen wurde. Im Checkout sind Name und E-Mail Pflichtfelder. Der Server validiert diese Voraussetzungen zusätzlich.

V24 – Planfunktion und Finanzierungsdossier
- Die Auswahl „für mich“, „Bank/Kredit“, „Förderung“ oder „beides“ verändert jetzt tatsächlich die Ausarbeitung.
- Bank/Förderung erzeugt eine deutlich tiefere Finanzierungsfassung mit Kapitalbedarf, Mittelverwendung, Liquiditäts-/Rentabilitätslogik, Risiken und Unterlagen-Checkliste – ohne automatischen Preisaufschlag.
- Bank/Förderung nutzt höhere Reasoning-Tiefe und mehr Ausgabebudget; die 4,99-/49-/14,99-€-Stufen bleiben trotzdem die Preisobergrenzen.
- Im Ergebnis erscheint bei Finanzierungsmodus ein eigener dunkler „Finanzierungsdossier“-Abschnitt mit ankreuzbarer Nachweis-Checkliste.
- Das Erstellungsfenster zeigt 9 sichtbare Arbeitsschritte sowie Planqualität, Verwendungszweck und Ausarbeitungstiefe.
- Name und gültige E-Mail sind im Demo-Checkout sichtbar als Pflichtfelder markiert.


V29 TESTMODUS
-------------
Stripe und PayPal sind in der Oberfläche vorübergehend deaktiviert. Nach vollständigem Finder sowie Name, gültiger E-Mail, Vorhaben und Zustimmung kann der Businessplan direkt erzeugt werden. Der Server akzeptiert dafür ausschließlich den lokalen Demo-Bypass, solange DEMO_PAYMENT_BYPASS=true ist. Vor einem echten Livegang unbedingt DEMO_PAYMENT_BYPASS=false setzen und den echten Zahlungsablauf wieder aktivieren.


QUALITÄTSPRÜFUNG
-----------------
Nach der ersten Planerstellung prüft standardmäßig ein zweites Modell (REVIEW_MODEL=gpt-5.6-luna) den Businessplan auf Konsistenz, Rechenlogik, Wiederholungen, Rohdaten und Paketqualität. Erkennt die Prüfung relevante Mängel, wird der Plan vor Auslieferung automatisch überarbeitet.

V43 – stabiler Direkt-PDF-Export
- Der PDF-Button nutzt nicht mehr den Browser-Druckdialog als Layout-Engine.
- Der Businessplan wird direkt im Browser auf feste A4-Seiten gerendert und als PDF-Datei heruntergeladen.
- Dadurch können Website-CSS, Grids, versteckte Container und Druckvorschau-Regeln den Text nicht mehr auf schmale Spalten zusammendrücken.
- Tabellen, Planungsannahmen, Fließtext, Checklisten und Abschluss werden mit eigener Seitenumbruchlogik gesetzt.
- Bilder werden in die PDF-Seiten eingebettet, sofern sie im aktuellen Plan verfügbar sind.
- Im PDF erscheinen keine localhost-URL, Browser-Kopfzeilen oder Browser-Datumszeilen.
- Abschluss jeder Plantiefe: Danke für dein Vertrauen ... Bis bald!


V44 Stabilitaet: Die zweite Qualitätsprüfung nutzt standardmäßig Luna und fällt bei technischen Problemen automatisch auf weitere konfigurierte Modelle zurück. Ein bereits gültiger Plan wird nicht mehr wegen eines separaten Review-Fehlers verworfen.


=== V48 LIVE-HINWEISE ===
- Stripe Checkout ist wieder aktiviert. Benötigte Railway-Variablen: STRIPE_SECRET_KEY, STRIPE_PRICE_START, STRIPE_PRICE_PLUS, STRIPE_PRICE_PRO.
- PUBLIC_BASE_URL sollte auf https://erstelli.com stehen. Falls sie fehlt/localhost ist, nutzt der Server auf Railway den Forwarded Host.
- DEMO_PAYMENT_BYPASS wird auf Railway aus Sicherheitsgründen ignoriert. Lokal kann er optional für Entwicklung aktiviert werden.
- Stripe-Zahlungen sind an Paketpreis UND konkrete Bestellung gebunden. Ein bezahltes Start-Paket kann nicht als Pro-Zahlung wiederverwendet werden.
- Frag Erstelli zeigt in Produktion keine localhost-/START_KI-Hinweise mehr. /api/status prüft, ob OPENAI_API_KEY und Stripe vollständig konfiguriert sind.
- Rechtliche Seiten: /impressum.html, /datenschutz.html und /agb-widerruf.html. Bitte bei Änderungen der Anbieterstruktur oder Dienstleister fachlich prüfen/aktualisieren.
- package.json wurde ergänzt; Railway kann den Dienst mit `npm start` bzw. `node server.js` starten.
