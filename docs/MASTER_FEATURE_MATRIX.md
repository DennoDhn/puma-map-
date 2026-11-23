# PumaMap – zentrale Master-Feature-Matrix

Stand: Entwicklungscheckpoint 0.6. Die Nummer ist **kein Fertigstellungsgrad**. Diese Datei ersetzt die widersprüchlichen additiven Altmatrizen. Historische Nachweise bleiben in Release-/Testdokumenten.

Bewertung: **Teilweise** = Quellcode vorhanden, der gesamte geforderte Ablauf oder seine vollständige Geräte-/Betriebsabnahme fehlt. **Nicht implementiert** = keine fertige Implementierung. **Technisch blockiert** = konkrete externe Abhängigkeit. **Vollständig** gilt nur für die ausdrücklich eng bezeichnete und nachgewiesene Funktion, nicht automatisch für ein Modul. Derzeit ist **kein vollständiges Produktmodul nach der Master-Definition abgenommen**.

Die Quell- und Testspalten benennen überprüfbare Nachweise; eine Testdatei allein ist kein bestandener Test. Aktuelle Ausführungsresultate: [TESTS.md](TESTS.md). Verbindliche Reihenfolge und Abnahmekriterien: [ROADMAP_1_0.md](ROADMAP_1_0.md).

## Startseite

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/components/platform.tsx`. Prüfbeleg/-grenze: `tests/e2e/platform.spec.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| HOME-001 | Hero mit eigenem Fahrzeugmotiv | Teilweise |
| HOME-002 | Registrierung/Anmeldung | Teilweise |
| HOME-003 | echte Live-Statistiken | Teilweise |
| HOME-004 | Fahrzeugvorschau | Teilweise |
| HOME-005 | aktuelle Beiträge | Teilweise |
| HOME-006 | kuratierte Featured Builds | Nicht implementiert |
| HOME-007 | neue Mitglieder | Nicht implementiert |
| HOME-008 | Eventvorschau | Nicht implementiert |
| HOME-009 | Marktplatz-Highlights | Nicht implementiert |
| HOME-010 | Club-Highlights | Nicht implementiert |
| HOME-011 | Wiki-Neuigkeiten | Nicht implementiert |
| HOME-012 | Aktivitätsstrom | Nicht implementiert |

## Benutzerkonten

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/lib/api.ts`. Prüfbeleg/-grenze: `tests/integration.test.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| AUTH-001 | Registrierung | Teilweise |
| AUTH-002 | Anmeldung | Teilweise |
| AUTH-003 | Abmeldung | Teilweise |
| AUTH-004 | E-Mail-Verifizierung | Teilweise |
| AUTH-005 | Passwort-Reset | Teilweise |
| AUTH-006 | sichere Sessions | Teilweise |
| AUTH-007 | serverseitige Validierung | Teilweise |
| AUTH-008 | Benutzername | Teilweise |
| AUTH-009 | Profilbeschreibung | Teilweise |
| AUTH-010 | regionale Standortfreigabe | Teilweise |
| AUTH-011 | Profilbearbeitung | Teilweise |
| AUTH-012 | Datenexport | Teilweise |
| AUTH-013 | Account-Löschung | Teilweise |
| AUTH-014 | Profilbild | Nicht implementiert |
| AUTH-015 | Titelbild | Nicht implementiert |
| AUTH-016 | Passwortänderung im Konto | Nicht implementiert |
| AUTH-017 | granulare Profilsichtbarkeit | Nicht implementiert |
| AUTH-018 | MFA für privilegierte Konten | Nicht implementiert |
| AUTH-019 | produktive E-Mail-Zustellung | Nicht implementiert |

## Mitgliederprofile

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/components/platform-dialogs.tsx`. Prüfbeleg/-grenze: `tests/community.test.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| PROFILE-001 | öffentliche Profilübersicht | Teilweise |
| PROFILE-002 | öffentliche Fahrzeugliste | Teilweise |
| PROFILE-003 | öffentliche Builds und Beiträge | Teilweise |
| PROFILE-004 | öffentliche Inhaltsstatistiken | Teilweise |
| PROFILE-005 | Region nur mit Einwilligung | Teilweise |
| PROFILE-006 | Verknüpfungen zu Fahrzeugen und Inhalten | Teilweise |
| PROFILE-007 | Profil-Tabs | Nicht implementiert |
| PROFILE-008 | vollständige Aktivitätspagination | Nicht implementiert |
| PROFILE-009 | Clubmitgliedschaften | Nicht implementiert |
| PROFILE-010 | Auszeichnungen | Nicht implementiert |
| PROFILE-011 | Profilrahmen | Nicht implementiert |
| PROFILE-012 | öffentliche Favoriten-Einwilligung | Nicht implementiert |
| PROFILE-013 | eigene Profil-URLs | Nicht implementiert |
| PROFILE-014 | Sammlerprofile | Nicht implementiert |

## Community-Karte

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/components/community-map.tsx`. Prüfbeleg/-grenze: `tests/integration.test.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| MAP-001 | interaktive Regionalkarte | Teilweise |
| MAP-002 | Mitgliederfilter | Teilweise |
| MAP-003 | regionale Markergruppen | Teilweise |
| MAP-004 | markergebundene Popups | Teilweise |
| MAP-005 | Profilzugriff | Teilweise |
| MAP-006 | Zustimmung vor externen Tiles | Teilweise |
| MAP-007 | Standortwiderruf | Teilweise |
| MAP-008 | eingeschränkte Kartennutzung ohne Freigabe | Teilweise |
| MAP-009 | Stadt-/PLZ-Geocoding | Nicht implementiert |
| MAP-010 | dynamisches viewportbasiertes Clustering | Nicht implementiert |
| MAP-011 | Fahrzeugvariantenfilter | Nicht implementiert |
| MAP-012 | Clubmarker | Nicht implementiert |
| MAP-013 | Eventmarker | Nicht implementiert |
| MAP-014 | Treffen/Ausfahrten-Marker | Nicht implementiert |
| MAP-015 | große Datenmengen unter Last | Nicht implementiert |
| MAP-016 | Popup-Abnahme bei Zoom und Resize auf echten Geräten | Nicht implementiert |

## Fahrzeuggarage

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/components/vehicle-dossier.tsx`. Prüfbeleg/-grenze: `tests/integration.test.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| GARAGE-001 | mehrere Fahrzeuge | Teilweise |
| GARAGE-002 | Fahrzeuganlage/Bearbeitung/Löschung | Teilweise |
| GARAGE-003 | Name/Variante/Baujahr | Teilweise |
| GARAGE-004 | Motorisierungsangabe | Teilweise |
| GARAGE-005 | Leistung/Laufleistung/Farbe | Teilweise |
| GARAGE-006 | Beschreibung | Teilweise |
| GARAGE-007 | öffentlich/private Fahrzeuge | Teilweise |
| GARAGE-008 | Fahrzeugdetail-URLs | Teilweise |
| GARAGE-009 | Wartungs- und Reparaturjournal | Teilweise |
| GARAGE-010 | Build-Einträge | Teilweise |
| GARAGE-011 | Kategorien/Fortschritt | Teilweise |
| GARAGE-012 | Historienfilter und Pagination | Teilweise |
| GARAGE-013 | private Kosten | Teilweise |
| GARAGE-014 | Änderungsschutz durch Revisionen | Teilweise |
| GARAGE-015 | private Versionswiederherstellung | Teilweise |
| GARAGE-016 | begrenzte Snapshot-Aufbewahrung | Teilweise |
| GARAGE-017 | Metadaten-Änderungsprotokoll | Teilweise |
| GARAGE-018 | geschützter Dokumententresor | Nicht implementiert |
| GARAGE-019 | Wartungsplanung | Nicht implementiert |
| GARAGE-020 | Wartungserinnerungen | Nicht implementiert |
| GARAGE-021 | Fahrzeugvergleich | Nicht implementiert |
| GARAGE-022 | strukturierte technische Datenblätter | Nicht implementiert |
| GARAGE-023 | Fahrzeugzustandskatalog | Nicht implementiert |
| GARAGE-024 | seltene Modellvarianten-Datenbank | Nicht implementiert |

## Automotive Media Engine

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/lib/media.ts`. Prüfbeleg/-grenze: `tests/media.test.ts; tests/integration.test.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| MEDIA-001 | mehrere Fahrzeugbilder | Teilweise |
| MEDIA-002 | Titelbild | Teilweise |
| MEDIA-003 | Reihenfolge | Teilweise |
| MEDIA-004 | Bildbeschreibungen | Teilweise |
| MEDIA-005 | Ersetzen/Löschen | Teilweise |
| MEDIA-006 | Dateiinhaltsprüfung | Teilweise |
| MEDIA-007 | Größen-/Pixelgrenzen | Teilweise |
| MEDIA-008 | Metadatenbereinigung | Teilweise |
| MEDIA-009 | transaktionale Bildablage | Teilweise |
| MEDIA-010 | private Zugriffsprüfung | Teilweise |
| MEDIA-011 | Vorschaubilder | Teilweise |
| MEDIA-012 | vergrößerte Galerie | Teilweise |
| MEDIA-013 | Touch/Keyboard-Galerie | Teilweise |
| MEDIA-014 | Vorher-Nachher-Vergleich | Teilweise |
| MEDIA-015 | Medienzuordnung zu Journal/Teilen/Meilensteinen | Teilweise |
| MEDIA-016 | Social-Post-Bilder | Nicht implementiert |
| MEDIA-017 | Profil-/Titelbilder | Nicht implementiert |
| MEDIA-018 | Forum-Anhänge | Nicht implementiert |
| MEDIA-019 | Marktplatzgalerien | Nicht implementiert |
| MEDIA-020 | Eventbilder | Nicht implementiert |
| MEDIA-021 | Virenscan für Dokumente | Nicht implementiert |
| MEDIA-022 | Object-Storage-Betrieb | Nicht implementiert |
| MEDIA-023 | belastbare Multiworker-Upload-Lasttests | Nicht implementiert |

## Teileverwaltung

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/lib/vehicle-workspace.ts`. Prüfbeleg/-grenze: `tests/integration.test.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| PARTS-001 | Teile-CRUD | Teilweise |
| PARTS-002 | Kategorie | Teilweise |
| PARTS-003 | Hersteller | Teilweise |
| PARTS-004 | benutzereigene Teilenummer | Teilweise |
| PARTS-005 | Zustand | Teilweise |
| PARTS-006 | Einbaudatum/Kilometerstand | Teilweise |
| PARTS-007 | private Bezugsquelle | Teilweise |
| PARTS-008 | privater Kaufpreis | Teilweise |
| PARTS-009 | Notizen | Teilweise |
| PARTS-010 | Bilder | Teilweise |
| PARTS-011 | Installationsstatus | Teilweise |
| PARTS-012 | Fahrzeugzuordnung | Teilweise |
| PARTS-013 | Journalverknüpfung | Teilweise |
| PARTS-014 | Mehrfach-Teileverknüpfungen | Nicht implementiert |
| PARTS-015 | Dokumente | Nicht implementiert |
| PARTS-016 | globale Suche/Filter/Sortierung | Nicht implementiert |
| PARTS-017 | Teilegruppen | Nicht implementiert |
| PARTS-018 | Ein-/Ausbauhistorie | Nicht implementiert |
| PARTS-019 | Teilevergleich | Nicht implementiert |
| PARTS-020 | private Bestandslisten | Nicht implementiert |
| PARTS-021 | Wiki-/Marktplatz-Relationen | Nicht implementiert |
| PARTS-022 | geprüfte Kompatibilitäten | Nicht implementiert |

## Build-Management

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/lib/api.ts`. Prüfbeleg/-grenze: `tests/integration.test.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| BUILD-001 | explizite Veröffentlichung aus Journal | Teilweise |
| BUILD-002 | gemeinsame Quellreferenz statt automatischer Veröffentlichung | Teilweise |
| BUILD-003 | öffentliches Build-Profil als Inhaltsseite | Teilweise |
| BUILD-004 | Kommentare | Teilweise |
| BUILD-005 | Likes | Teilweise |
| BUILD-006 | Favoriten | Teilweise |
| BUILD-007 | Direktlinks | Teilweise |
| BUILD-008 | Fortschritt | Teilweise |
| BUILD-009 | Kategorien | Teilweise |
| BUILD-010 | chronologische Journalansicht | Teilweise |
| BUILD-011 | Meilenstein-CRUD | Teilweise |
| BUILD-012 | Status/Zieltermin/Abschlussdatum | Teilweise |
| BUILD-013 | Meilenstein-Bilder | Teilweise |
| BUILD-014 | Verknüpfung eines Teils/Eintrags | Teilweise |
| BUILD-015 | sofortige Zugriffssperre bei Sichtbarkeitswiderruf | Teilweise |
| BUILD-016 | mehrere eigenständige Projekte pro Fahrzeug | Nicht implementiert |
| BUILD-017 | Projektphasen | Nicht implementiert |
| BUILD-018 | Aufgabenlisten | Nicht implementiert |
| BUILD-019 | globale interaktive Projekt-Timeline | Nicht implementiert |
| BUILD-020 | mehrere Teile pro Meilenstein | Nicht implementiert |
| BUILD-021 | Rankings | Nicht implementiert |
| BUILD-022 | Forum-/Wiki-Verknüpfungspicker | Nicht implementiert |
| BUILD-023 | vollständige Build-Galerie mit Filtern | Nicht implementiert |

## Community Feed

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/components/platform.tsx`. Prüfbeleg/-grenze: `tests/integration.test.ts; tests/community.test.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| FEED-001 | Textbeiträge erstellen/bearbeiten/löschen | Teilweise |
| FEED-002 | Kommentare | Teilweise |
| FEED-003 | Antworten mit Elternreferenz | Teilweise |
| FEED-004 | eigene Kommentare bearbeiten/entfernen | Teilweise |
| FEED-005 | Like | Teilweise |
| FEED-006 | Speichern | Teilweise |
| FEED-007 | Direktlinks | Teilweise |
| FEED-008 | Textsuche | Teilweise |
| FEED-009 | serverseitige Pagination | Teilweise |
| FEED-010 | Meldung von Inhalten | Teilweise |
| FEED-011 | Moderationsstatus | Teilweise |
| FEED-012 | Fahrzeugverknüpfung für verknüpfte Builds | Teilweise |
| FEED-013 | mehrere Beitragsbilder | Nicht implementiert |
| FEED-014 | Bildlöschung | Nicht implementiert |
| FEED-015 | weitere Reaktionstypen | Nicht implementiert |
| FEED-016 | Teilen-Dialog/Web Share | Nicht implementiert |
| FEED-017 | Hashtags | Nicht implementiert |
| FEED-018 | Erwähnungen | Teilweise – neue Beiträge, Themen und Kommentare; Geräteabnahme offen |
| FEED-019 | allgemeine Profil-/Fahrzeug-/Build-Linkpicker | Nicht implementiert |
| FEED-020 | Feed-Sortierauswahl | Nicht implementiert |
| FEED-021 | optimistische Konfliktkontrolle für Social-Edits | Nicht implementiert |

## Forum

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/lib/community.ts`. Prüfbeleg/-grenze: `tests/community.test.ts; tests/e2e/community.spec.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| FORUM-001 | Themen erstellen/bearbeiten/löschen | Teilweise |
| FORUM-002 | Kategorien als Texte | Teilweise |
| FORUM-003 | Antworten | Teilweise |
| FORUM-004 | Antwortbezüge | Teilweise |
| FORUM-005 | eigene Antwortbearbeitung | Teilweise |
| FORUM-006 | Soft-Delete mit erhaltener Antwortstruktur | Teilweise |
| FORUM-007 | Themen schließen/öffnen | Teilweise |
| FORUM-008 | Themen anheften | Teilweise |
| FORUM-009 | Themenabonnements | Teilweise |
| FORUM-010 | Suchfunktion | Teilweise |
| FORUM-011 | Pagination | Teilweise |
| FORUM-012 | Moderations-Audit | Teilweise |
| FORUM-013 | Abonnenten-Benachrichtigungen | Teilweise |
| FORUM-014 | relationale Kategorien | Nicht implementiert |
| FORUM-015 | Unterkategorien | Nicht implementiert |
| FORUM-016 | Zitierfunktion | Nicht implementiert |
| FORUM-017 | Bilder | Nicht implementiert |
| FORUM-018 | Anhänge | Nicht implementiert |
| FORUM-019 | eigene Themenansicht außerhalb Modal | Nicht implementiert |
| FORUM-020 | interne Vorschaukarten für Profile/Fahrzeuge/Builds/Wiki/Teile/Angebote/Events | Nicht implementiert |
| FORUM-021 | einzelne Kommentarmeldungen | Teilweise – Meldung und Moderation integriert; Geräteabnahme offen |
| FORUM-022 | Moderationsbegründung für Kommentarentfernung | Nicht implementiert |
| FORUM-023 | Abonnements über 500 mit Queue | Nicht implementiert |

## Marktplatz

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/lib/api.ts`. Prüfbeleg/-grenze: `tests/integration.test.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| MARKET-001 | Textinserate | Teilweise |
| MARKET-002 | Inserate bearbeiten/löschen | Teilweise |
| MARKET-003 | Preis | Teilweise |
| MARKET-004 | Kategorie | Teilweise |
| MARKET-005 | Region | Teilweise |
| MARKET-006 | Suche | Teilweise |
| MARKET-007 | Favoriten | Teilweise |
| MARKET-008 | Verkäuferprofil | Teilweise |
| MARKET-009 | verfügbar/reserviert/verkauft | Teilweise |
| MARKET-010 | Meldungen | Teilweise |
| MARKET-011 | Moderation | Teilweise |
| MARKET-012 | keine Echtgeld-Zahlungsabwicklung | Teilweise |
| MARKET-013 | getrennte Ersatzteil-/Fahrzeug-/Zubehör-/Suchanzeigen-/Projektfahrzeug-/Teilepakettypen | Nicht implementiert |
| MARKET-014 | Bildergalerien | Nicht implementiert |
| MARKET-015 | Zustand | Nicht implementiert |
| MARKET-016 | strukturierte Filter | Nicht implementiert |
| MARKET-017 | private Verkäuferanfragen | Nicht implementiert |
| MARKET-018 | Inseratsverwaltung-Dashboard | Nicht implementiert |
| MARKET-019 | Archivierung | Nicht implementiert |
| MARKET-020 | rechtlich geprüfte Pflichtangaben | Nicht implementiert |

## Technisches Wiki

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/lib/api.ts`. Prüfbeleg/-grenze: `tests/integration.test.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| WIKI-001 | Artikelentwurf | Teilweise |
| WIKI-002 | Bearbeitung | Teilweise |
| WIKI-003 | Quellenpflicht | Teilweise |
| WIKI-004 | Textsuche | Teilweise |
| WIKI-005 | Kategorien als Texte | Teilweise |
| WIKI-006 | Versionshistorie | Teilweise |
| WIKI-007 | unabhängige redaktionelle Freigabe | Teilweise |
| WIKI-008 | Moderation | Teilweise |
| WIKI-009 | Tags | Nicht implementiert |
| WIKI-010 | Versionsvergleich und Wiederherstellung | Nicht implementiert |
| WIKI-011 | strukturierte Teileverknüpfung | Nicht implementiert |
| WIKI-012 | Fahrzeugbezüge | Nicht implementiert |
| WIKI-013 | geprüfte Fachinhalte Motor/Getriebe/Fahrwerk/Bremsen/Elektrik/Karosserie/Innenraum | Nicht implementiert |
| WIKI-014 | Wartungs-/Reparaturanleitungen | Nicht implementiert |
| WIKI-015 | Teilenummern-/Kompatibilitätsdatenbank | Nicht implementiert |
| WIKI-016 | Kaufberatung/Schwachstellen | Nicht implementiert |
| WIKI-017 | technische Daten/Modellgeschichte | Nicht implementiert |

## Events

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/lib/api.ts`. Prüfbeleg/-grenze: `tests/integration.test.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| EVENT-001 | Eventanlage | Teilweise |
| EVENT-002 | Datum/Uhrzeit | Teilweise |
| EVENT-003 | öffentlicher Treffpunkt | Teilweise |
| EVENT-004 | Beschreibung | Teilweise |
| EVENT-005 | Anmeldung/Abmeldung | Teilweise |
| EVENT-006 | Teilnehmerzahl | Teilweise |
| EVENT-007 | Kommentare | Teilweise |
| EVENT-008 | Bilder | Nicht implementiert |
| EVENT-009 | Teilnehmer-Privatsphäre | Nicht implementiert |
| EVENT-010 | Eventkarte | Nicht implementiert |
| EVENT-011 | wiederkehrende Treffen | Nicht implementiert |
| EVENT-012 | private Events | Nicht implementiert |
| EVENT-013 | Einladungen | Nicht implementiert |
| EVENT-014 | Eventbenachrichtigungen | Nicht implementiert |
| EVENT-015 | Archiv vergangener Treffen | Nicht implementiert |
| EVENT-016 | Clubs-Verknüpfung | Nicht implementiert |

## Clubs und Crews

Modulstatus: Nicht implementiert.

Quellbeleg: `prisma/schema.prisma`. Prüfbeleg/-grenze: `Keine Implementierungstests`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| CLUB-001 | Cluberstellung | Nicht implementiert |
| CLUB-002 | Clublogo | Nicht implementiert |
| CLUB-003 | Beschreibung/Region | Nicht implementiert |
| CLUB-004 | Clubprofil | Nicht implementiert |
| CLUB-005 | Mitgliederliste | Nicht implementiert |
| CLUB-006 | Rollen | Nicht implementiert |
| CLUB-007 | Beitrittsanfragen | Nicht implementiert |
| CLUB-008 | Clubfeed | Nicht implementiert |
| CLUB-009 | interne Diskussionen | Nicht implementiert |
| CLUB-010 | Clubevents | Nicht implementiert |
| CLUB-011 | Gruppenverwaltung | Nicht implementiert |
| CLUB-012 | öffentliche/private Gruppen | Nicht implementiert |
| CLUB-013 | Karten-/Fahrzeugverknüpfung | Nicht implementiert |
| CLUB-014 | Clubstatistiken | Nicht implementiert |

## Onyx-Reputation

Modulstatus: Nicht implementiert.

Quellbeleg: `prisma/schema.prisma`. Prüfbeleg/-grenze: `Keine Implementierungstests`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| POINT-001 | virtuelle Onyx-Punkte ohne Geldwert | Nicht implementiert |
| POINT-002 | serverseitige Vergaberegeln | Nicht implementiert |
| POINT-003 | idempotentes Transaktionsledger | Nicht implementiert |
| POINT-004 | Farming-/Missbrauchsschutz | Nicht implementiert |
| POINT-005 | Erfahrungspunkte | Nicht implementiert |
| POINT-006 | Level | Nicht implementiert |
| POINT-007 | Ränge | Nicht implementiert |
| POINT-008 | Community Score | Nicht implementiert |
| POINT-009 | Fortschrittsanzeigen | Nicht implementiert |
| POINT-010 | Mitgliedstitel | Nicht implementiert |
| POINT-011 | Ranglisten | Nicht implementiert |
| POINT-012 | Eventauszeichnungen | Nicht implementiert |
| POINT-013 | langjährige Mitgliedschaft | Nicht implementiert |

## Achievements

Modulstatus: Nicht implementiert.

Quellbeleg: `prisma/schema.prisma`. Prüfbeleg/-grenze: `Keine Implementierungstests`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| AWARD-001 | Fahrzeugprojekt-Auszeichnungen | Nicht implementiert |
| AWARD-002 | technische Beiträge | Nicht implementiert |
| AWARD-003 | hilfreiche Antworten | Nicht implementiert |
| AWARD-004 | Community-Aktivität | Nicht implementiert |
| AWARD-005 | Eventteilnahme | Nicht implementiert |
| AWARD-006 | seltene Fahrzeuge | Nicht implementiert |
| AWARD-007 | Meilensteine | Nicht implementiert |
| AWARD-008 | Seltenheitsstufen | Nicht implementiert |
| AWARD-009 | individuelle Metallic-Badges | Nicht implementiert |
| AWARD-010 | Profilrahmen | Nicht implementiert |
| AWARD-011 | Freischaltanimation | Nicht implementiert |
| AWARD-012 | Verwaltung der Vergaberegeln | Nicht implementiert |

## Legacy Center

Modulstatus: Nicht implementiert.

Quellbeleg: `prisma/schema.prisma`. Prüfbeleg/-grenze: `Keine Implementierungstests`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| LEGACY-001 | Hall of Fame | Nicht implementiert |
| LEGACY-002 | Community Heroes | Nicht implementiert |
| LEGACY-003 | Memorial Wall | Nicht implementiert |
| LEGACY-004 | Legend Garage | Nicht implementiert |
| LEGACY-005 | besondere Builds | Nicht implementiert |
| LEGACY-006 | Community-Geschichte | Nicht implementiert |
| LEGACY-007 | langjährige Mitglieder | Nicht implementiert |
| LEGACY-008 | besondere Leistungen | Nicht implementiert |
| LEGACY-009 | Legacy Timeline | Nicht implementiert |
| LEGACY-010 | Einwilligung/Privatsphäre für Gedenkeinträge | Nicht implementiert |
| LEGACY-011 | redaktionelle Moderation | Nicht implementiert |

## Benachrichtigungen

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/components/notification-center.tsx`. Prüfbeleg/-grenze: `tests/community.test.ts; tests/e2e/community.spec.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| NOTICE-001 | persistente Kommentare-/Antworten-Benachrichtigungen | Teilweise |
| NOTICE-002 | Forenabonnements | Teilweise |
| NOTICE-003 | optionale Like-Benachrichtigungen | Teilweise |
| NOTICE-004 | Build-Kommentare | Teilweise |
| NOTICE-005 | Moderationsmitteilungen | Teilweise |
| NOTICE-006 | gelesen/ungelesen | Teilweise |
| NOTICE-007 | einzeln öffnen | Teilweise |
| NOTICE-008 | alle gelesen markieren | Teilweise |
| NOTICE-009 | Einstellungen | Teilweise |
| NOTICE-010 | Deduplizierung | Teilweise |
| NOTICE-011 | Sichtbarkeitsprüfung beim Lesen | Teilweise |
| NOTICE-012 | Benachrichtigungspagination jenseits der letzten 50 | Teilweise |
| NOTICE-013 | Erwähnungen | Teilweise – neue Beiträge, Themen und Kommentare; Geräteabnahme offen |
| NOTICE-014 | Follower | Nicht implementiert |
| NOTICE-015 | Marktanfragen | Nicht implementiert |
| NOTICE-016 | Eventeinladungen | Nicht implementiert |
| NOTICE-017 | Clubanfragen | Nicht implementiert |
| NOTICE-018 | Achievement-Meldungen | Nicht implementiert |
| NOTICE-019 | Gruppierung | Nicht implementiert |
| NOTICE-020 | Push/E-Mail-Kanäle | Nicht implementiert |

## Community-Suche

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/components/community-discovery.tsx`. Prüfbeleg/-grenze: `tests/community.test.ts; tests/e2e/community.spec.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| SEARCH-001 | Mitgliedersuche | Teilweise |
| SEARCH-002 | Fahrzeugsuche | Teilweise |
| SEARCH-003 | Buildsuche | Teilweise |
| SEARCH-004 | Beitragssuche | Teilweise |
| SEARCH-005 | Forensuche | Teilweise |
| SEARCH-006 | Bereichsfilter | Teilweise |
| SEARCH-007 | neueste/älteste Sortierung | Teilweise |
| SEARCH-008 | Pagination | Teilweise |
| SEARCH-009 | Ergebnisvorschau | Teilweise |
| SEARCH-010 | Leer-/Fehler-/Ladezustände | Teilweise |
| SEARCH-011 | private Inhalte ausgeschlossen | Teilweise |
| SEARCH-012 | Wiki-/Markt-/Club-/Eventsuche | Nicht implementiert |
| SEARCH-013 | datenbankseitiger Volltextindex | Nicht implementiert |
| SEARCH-014 | Suchranking | Nicht implementiert |
| SEARCH-015 | Performance-Messung mit realistischen Datenmengen | Nicht implementiert |

## Administration

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/lib/api.ts`. Prüfbeleg/-grenze: `tests/integration.test.ts; tests/community.test.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| ADMIN-001 | RBAC Member/Moderator/Admin | Teilweise |
| ADMIN-002 | serverseitige Prüfungen | Teilweise |
| ADMIN-003 | Inhaltsmeldungen | Teilweise |
| ADMIN-004 | Meldungsbearbeitung durch Moderation | Teilweise |
| ADMIN-005 | Wiki-Freigabequeue | Teilweise |
| ADMIN-006 | Inhalte ausblenden/freigeben | Teilweise |
| ADMIN-007 | Themenstatus | Teilweise |
| ADMIN-008 | Kommentare entfernen | Teilweise |
| ADMIN-009 | Audit-Protokolle | Teilweise |
| ADMIN-010 | Rollenpromotion per CLI | Teilweise |
| ADMIN-011 | vollständiges Admin-Dashboard | Nicht implementiert |
| ADMIN-012 | Mitgliederverwaltung | Nicht implementiert |
| ADMIN-013 | Rollenverwaltung im UI | Nicht implementiert |
| ADMIN-014 | feingranulare Berechtigungen | Nicht implementiert |
| ADMIN-015 | Forumkategorienverwaltung | Nicht implementiert |
| ADMIN-016 | Markt-/Event-/Clubverwaltung | Nicht implementiert |
| ADMIN-017 | Achievement-/Gamificationverwaltung | Nicht implementiert |
| ADMIN-018 | Systemstatistiken | Nicht implementiert |
| ADMIN-019 | Sicherheitsereignis-Ansicht | Nicht implementiert |
| ADMIN-020 | Feature-Flags | Nicht implementiert |
| ADMIN-021 | Systemeinstellungen | Nicht implementiert |
| ADMIN-022 | administrative Löschkonzepte | Nicht implementiert |

## Private Kommunikation

Modulstatus: Nicht implementiert.

Quellbeleg: `prisma/schema.prisma`. Prüfbeleg/-grenze: `Keine Implementierungstests`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| DM-001 | optionale private Nachrichten | Nicht implementiert |
| DM-002 | Einwilligung/Blockieren | Nicht implementiert |
| DM-003 | Spam-/Missbrauchsmeldungen | Nicht implementiert |
| DM-004 | Datenschutz-/Moderationsregeln | Nicht implementiert |

## DriveOnyx Designsystem

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/app/globals.css`. Prüfbeleg/-grenze: `tests/e2e/community.spec.ts; tests/e2e/platform.spec.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| DESIGN-001 | Onyx/Lime-Farbtokens | Teilweise |
| DESIGN-002 | Black-Chrome-Panels | Teilweise |
| DESIGN-003 | Purple-Akzente | Teilweise |
| DESIGN-004 | responsive Typografie | Teilweise |
| DESIGN-005 | Buttons/Inputs/Textareas/Selects/Checkboxen | Teilweise |
| DESIGN-006 | native Dialoge | Teilweise |
| DESIGN-007 | Karten | Teilweise |
| DESIGN-008 | Badges/Status | Teilweise |
| DESIGN-009 | Toasts | Teilweise |
| DESIGN-010 | Skeletons | Teilweise |
| DESIGN-011 | Avatare mit Initialen | Teilweise |
| DESIGN-012 | Fortschrittsanzeigen | Teilweise |
| DESIGN-013 | Such-/Filterelemente | Teilweise |
| DESIGN-014 | Pagination | Teilweise |
| DESIGN-015 | Bildergalerie | Teilweise |
| DESIGN-016 | mobile Drawer-Navigation | Teilweise |
| DESIGN-017 | Hover/Mikrointeraktionen | Teilweise |
| DESIGN-018 | Reduced Motion | Teilweise |
| DESIGN-019 | Safe Areas | Teilweise |
| DESIGN-020 | vollständige semantische Token-Dokumentation | Nicht implementiert |
| DESIGN-021 | Tooltips/Popovers | Nicht implementiert |
| DESIGN-022 | Radio-Komponenten | Nicht implementiert |
| DESIGN-023 | konsistente Dropdowns/Tabs | Nicht implementiert |
| DESIGN-024 | komplexe Dashboard-Widgets | Nicht implementiert |
| DESIGN-025 | Achievement-Karten | Nicht implementiert |
| DESIGN-026 | animierte Statistiken | Nicht implementiert |
| DESIGN-027 | Seitenübergänge | Nicht implementiert |
| DESIGN-028 | Scroll-Reveals | Nicht implementiert |
| DESIGN-029 | Cinematic Fahrzeugfotografie | Nicht implementiert |
| DESIGN-030 | plattformweite visuelle Abnahme | Nicht implementiert |

## Sicherheit und Datenschutz

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/lib/security.ts; src/lib/api.ts`. Prüfbeleg/-grenze: `tests/unit.test.ts; tests/integration.test.ts; tests/community.test.ts`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| SECURITY-001 | Passwort-Hashing | Teilweise |
| SECURITY-002 | Session-Hashing | Teilweise |
| SECURITY-003 | sichere Produktionscookies | Teilweise |
| SECURITY-004 | Same-Origin-Schreibschutz | Teilweise |
| SECURITY-005 | Rate Limiting | Teilweise |
| SECURITY-006 | parametrisierte DB-Zugriffe | Teilweise |
| SECURITY-007 | React-Text-Escaping | Teilweise |
| SECURITY-008 | Besitzprüfung | Teilweise |
| SECURITY-009 | Rollenprüfung | Teilweise |
| SECURITY-010 | private Mediendaten | Teilweise |
| SECURITY-011 | Upload-Normalisierung | Teilweise |
| SECURITY-012 | Security Headers | Teilweise |
| SECURITY-013 | strukturierte Fehler | Teilweise |
| SECURITY-014 | Datenminimierung | Teilweise |
| SECURITY-015 | Standort-Einwilligung/Widerruf | Teilweise |
| SECURITY-016 | Kontolöschung/Export | Teilweise |
| SECURITY-017 | Dependency-Audit | Teilweise |
| SECURITY-018 | unabhängige OWASP-Prüfung | Nicht implementiert |
| SECURITY-019 | vollständige Missbrauchserkennung | Nicht implementiert |
| SECURITY-020 | mehrstufiger Spam-Schutz | Nicht implementiert |
| SECURITY-021 | Sicherheitsmonitoring | Nicht implementiert |
| SECURITY-022 | juristische Datenschutz-/Impressumsprüfung | Nicht implementiert |
| SECURITY-023 | Aufbewahrungs-/Backup-Löschfristen im Betrieb | Nicht implementiert |
| SECURITY-024 | MFA | Nicht implementiert |
| SECURITY-025 | Penetrationstest | Nicht implementiert |

## Betrieb und Sicherung

Modulstatus: Teilweise implementiert.

Quellbeleg: `scripts/export-project.py; scripts/test-cold-restore.mjs`. Prüfbeleg/-grenze: `Export- und Restore-Protokolle`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| OPS-001 | vollständige Git-Historie | Teilweise |
| OPS-002 | Quellenarchiv | Teilweise |
| OPS-003 | Prüfsummen | Teilweise |
| OPS-004 | Git-Mirror-Restore | Teilweise |
| OPS-005 | additive Migrationen | Teilweise |
| OPS-006 | wiederholte Migration | Teilweise |
| OPS-007 | isolierter PostgreSQL-Kaltbackup-Restore einschließlich Medienbytes | Teilweise |
| OPS-008 | Docker-/Deployment-Anleitung | Teilweise |
| OPS-009 | Health-Endpunkt | Teilweise |
| OPS-010 | CI-Konfiguration | Teilweise |
| OPS-011 | produktiver verschlüsselter Backup-Zeitplan | Nicht implementiert |
| OPS-012 | Offsite-Sicherung | Nicht implementiert |
| OPS-013 | pg_dump/pg_restore-Drill | Nicht implementiert |
| OPS-014 | Live-Backup/PITR | Nicht implementiert |
| OPS-015 | gemessene RPO/RTO | Nicht implementiert |
| OPS-016 | getesteter Release-Rollback | Nicht implementiert |
| OPS-017 | Monitoring/Alerting | Nicht implementiert |
| OPS-018 | Staging-Betrieb | Nicht implementiert |
| OPS-019 | HTTPS/SMTP/DNS-Abnahme | Nicht implementiert |

## Tests und Plattformqualität

Modulstatus: Teilweise implementiert.

Quellbeleg: `tests; .github/workflows/quality.yml`. Prüfbeleg/-grenze: `docs/TESTS.md`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| QUALITY-001 | TypeScript | Teilweise |
| QUALITY-002 | ESLint | Teilweise |
| QUALITY-003 | Produktions-Build | Teilweise |
| QUALITY-004 | Unit-/Medientests | Teilweise |
| QUALITY-005 | API-/Datenbanktests | Teilweise |
| QUALITY-006 | Migrationserhalt | Teilweise |
| QUALITY-007 | negative Berechtigungstests | Teilweise |
| QUALITY-008 | Firefox-Teilabläufe | Teilweise |
| QUALITY-009 | axe-Teilprüfungen | Teilweise |
| QUALITY-010 | Responsive-Teilprüfungen | Teilweise |
| QUALITY-011 | Quellschutzprüfung | Teilweise |
| QUALITY-012 | vollständige Cross-Browser-End-to-End-Abnahme | Nicht implementiert |
| QUALITY-013 | physische iOS-/Android-Geräte | Nicht implementiert |
| QUALITY-014 | vollständige WCAG 2.2 AA-Abnahme | Nicht implementiert |
| QUALITY-015 | Core Web Vitals | Nicht implementiert |
| QUALITY-016 | Lasttests | Nicht implementiert |
| QUALITY-017 | Query-/Index-Benchmarks | Nicht implementiert |
| QUALITY-018 | CDN-/Caching-Abnahme | Nicht implementiert |
| QUALITY-019 | gesamte kritische Nutzerreise | Nicht implementiert |

## SEO/PWA/Internationalisierung

Modulstatus: Teilweise implementiert.

Quellbeleg: `src/app/layout.tsx; next.config.ts`. Prüfbeleg/-grenze: `Produktivprüfungen offen`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| SEO-001 | grundlegende Metadaten | Teilweise |
| SEO-002 | semantische Grundstruktur | Teilweise |
| SEO-003 | Lazy Loading einiger Module | Teilweise |
| SEO-004 | absichtliche Indexierungssperre im Entwicklungsstand | Teilweise |
| SEO-005 | Open Graph je Inhalt | Nicht implementiert |
| SEO-006 | Canonicals | Nicht implementiert |
| SEO-007 | Sitemap | Nicht implementiert |
| SEO-008 | öffentliche Profil-Metadaten | Nicht implementiert |
| SEO-009 | strukturierte Daten | Nicht implementiert |
| SEO-010 | PWA-Manifest | Nicht implementiert |
| SEO-011 | App-Icons | Nicht implementiert |
| SEO-012 | Installierbarkeit | Nicht implementiert |
| SEO-013 | sicherer Offline-Fallback | Nicht implementiert |
| SEO-014 | next-intl | Nicht implementiert |
| SEO-015 | europäische Sprachversionen | Nicht implementiert |

## Projektführung

Modulstatus: Teilweise implementiert.

Quellbeleg: `docs`. Prüfbeleg/-grenze: `Quellcode-/Dokumentationsabgleich`.

| ID | Anforderung | Status / verbleibende Abnahme |
|---|---|---|
| DOC-001 | README | Teilweise |
| DOC-002 | Architektur | Teilweise |
| DOC-003 | Datenmodell | Teilweise |
| DOC-004 | Setup | Teilweise |
| DOC-005 | Deployment | Teilweise |
| DOC-006 | Backup/Restore | Teilweise |
| DOC-007 | Sicherheit | Teilweise |
| DOC-008 | Designsystem | Teilweise |
| DOC-009 | Testübersicht | Teilweise |
| DOC-010 | Feature-Matrix | Teilweise |
| DOC-011 | Changelog | Teilweise |
| DOC-012 | offene Punkte | Teilweise |
| DOC-013 | Entwicklungscheckpoints | Teilweise |
| DOC-014 | automatischer Dokumentationsabgleich pro Release | Nicht implementiert |
| DOC-015 | vollständige professionelle Übergabe nach 1.0-Abnahme | Nicht implementiert |

## Technisch blockierte Abnahmen

| ID | Anforderung | Konkreter Blocker |
|---|---|---|
| BLOCK-001 | Privates GitHub-Repository / Push / Branch-Schutz / ausgeführte Actions | puma-map: authentifiziert 404; puma-map-: öffentlich, kein Upload. |
| BLOCK-002 | Chromium / WebKit lokale Abnahme | Browser-/Systemlaufzeit aktuell nicht zuverlässig verfügbar; konkrete Protokolle in TESTS.md. |
| BLOCK-003 | Historischer VPS-Import | Bereinigter Quellstand und autorisierter Zugang fehlen; keine Migration produktiver Daten. |
| BLOCK-004 | Produktivveröffentlichung puma-map.de | Freigabe, Hosting/SMTP/DNS, Rechtsprüfung und vollständige Sicherheits-/Qualitätsabnahme fehlen. |

## Verbindliche Produktgrenzen

Keine Echtgeldzahlungen, Guthaben, Auszahlungen oder käuflichen Onyx-Vorteile. Keine exakten privaten Standorte ohne informierte Einwilligung. Keine erfundenen technischen Daten/Teilenummern. Keine mobile Bottom-Navigation. Keine Produktivänderungen ohne erforderliche Freigabe. Keine unlizenzierte Medienübernahme.

488 einzeln referenzierbare Anforderungen; die Anzahl ist kein gewichteter Fortschrittswert. Querschnittsanforderungen gelten für alle Module, nicht nur für die zugeordnete Tabellenzeile. Die Anforderungen der Direktiven 0.1–0.6 sind hier zusammengeführt. Jede spätere Abnahme muss die ID, Commit, Testlauf und verbleibende Grenzen benennen.
