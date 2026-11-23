# Verbindlicher Entwicklungs- und Abnahmeplan bis 1.0

Kein Terminversprechen ohne vermessene Restarbeit und verfügbare Betriebsumgebung.
0.6 bedeutet nicht 60 %. Ein Checkpoint dokumentiert geprüfte Änderungen, keine Fertigstellungsquote.
Alle Anforderungen bleiben im Umfang; eine kleinere Pilotfreigabe ersetzt nicht die vollständige 1.0.

## Reihenfolge und konkrete Austrittskriterien

| Priorität / Paket | Umsetzung | Abnahme vor nächstem Paket |
|---|---|---|
| P0 – vorhandene Abläufe absichern | Community-Browserfehler, Zugriffsprüfungen, Medien-/DB-Restore, GitHub CI ausführen | Keine kritischen Fehler in vorhandenen Nutzerreisen; wiederhergestellte Daten/Medien bytegenau; alle ausgeführten Tests dokumentiert |
| P1 – Community vollständig | Social-Medienpipeline wiederverwenden, Hashtags/Erwähnungen, Teilen, Kommentar-Meldungen, relationale Forumkategorien/Unterkategorien, Zitate/Anhänge, Linkpicker, Abonnementqueue, Benachrichtigungspagination | Zwei Mitglieder erstellen Beiträge/Themen mit Bildern, antworten, abonnieren, erhalten/öffnen Mitteilungen; Moderator entfernt/sperrt; Privacy-Widerruf wirkt überall; mobile E2E erfolgreich |
| P2 – Identität und Entdeckung | Profilbilder/Titelbilder, Profilrouten/Tabs/Privatsphäre, globale Suche/indizierte Queries, Karte mit Clustering/PLZ/Fahrzeugfiltern | Öffentliche Profile zeigen nur freigegebene Inhalte; private Daten fehlen in API/Suche/Vorschau; Kartenpopups auf realen Geräten korrekt |
| P3 – Marktplatz betriebsfähig | strukturierte Inserattypen, Bilder/Zustände/Filter, Anfragen, Archivierung, Verkäuferverwaltung, juristische Pflichtangaben | Verkäufer erstellt/ändert/reserviert/verkauft; Interessent sucht/kontaktiert/meldet; keine Zahlungssimulation; Rollen- und Missbrauchstests |
| P4 – Wiki, Events und Clubs | Wiki-Versionen/Quellen/Verknüpfungen; öffentliche/private Events, Wiederholung/Karte/Teilnahme; Clubs mit Rollen/Anfragen/Feed/Events | Vollständige Nutzerreisen pro Modul inklusive privater Gruppen und unabhängiger Wiki-Freigabe; keine erfundenen Fachdaten |
| P5 – Fahrzeugmanagement vervollständigen | mehrere Build-Projekte, Aufgaben/Phasen, Teilehistorie/Mehrfachlinks, Dokumententresor, Wartungserinnerungen | Dokumente nur Besitzer; Projekt-/Teileverknüpfungen konsistent; Planung/Erinnerung persistent; Restore/Export/Löschung einschließlich Medien getestet |
| P6 – Reputation und Legacy | idempotentes Punkteledger, Regeln/Limits, Level/Achievements/Profilrahmen, Legacy-Redaktion/Einwilligungen | Doppelvergaben/Farming verhindert; keine Geldfunktionen; Memorial-Inhalte nur nach dokumentierter Freigabe |
| P7 – vollständiges Control Center | Mitglieder-/Rollenverwaltung, feingranulare Moderation, Flags/Einstellungen, System-/Sicherheitsstatistiken, Audit und Aufbewahrung | Jede Adminfunktion per Negativtest gesperrt; kritische Aktionen nachvollziehbar; privilegierte Konten abgesichert |
| P8 – Produktweite Abnahme | konsistentes Design/Motion, SEO/i18n/PWA, WCAG, Performance, Last, echte iOS/Android/Browser, SMTP, unabhängige Sicherheit | Kein offener kritischer/hoher Sicherheitsfehler; alle Master-Kernfunktionen abgenommen; gemessene Performancebudgets; Rechtsdokumente geprüft |
| P9 – Staging → Produktion | HTTPS/DNS/Secrets, automatisierte verschlüsselte Offsite-Backups, Restore/Rollback, Monitoring, Migrationsplan | Staging-End-to-End und Restore erfolgreich; Freigabe des Betreibers; danach Deployment und produktive Health-/Privacy-Verifikation |

## Arbeitsregeln für folgende Checkpoints

1. Pro Paket komplette vertikale Nutzerabläufe liefern, nicht bloß zusätzliche Datenmodelle.
2. Kein weiteres Garage-Detailpaket vor P1–P4, außer ein Sicherheits-/Datenverlustfehler erfordert es.
3. Vor Änderungen Git-Sicherung; nach Änderungen Quell-/Testbelege in der Master-Matrix aktualisieren.
4. Jedem offenen Punkt eine Anforderungs-ID zuordnen. Nicht mehr mehrere widersprüchliche Statuslisten pflegen.
5. Wenn ein Paket an externem Zugriff hängt, das nächste unabhängige Paket bearbeiten; Blocker explizit behalten.
6. Vollständig heißt UI, Persistenz, Validierung, Rechte, Leer-/Fehlerfälle, mobile Prüfung, Tests, Dokumentation und Git.
7. Keine pauschale Produktionsreife aus erfolgreichem Build oder einer einzelnen Firefox-Prüfung ableiten.

## Externe Mitwirkung, die tatsächlich nötig bleibt

- Zielrepo vom Nutzer bestätigt: `DennoDhn/puma-map-`.
- Für Betrieb: autorisierter Server-/Staging-Zugang, SMTP und DNS-Konfiguration; Secrets außerhalb Git.
- Betreiberangaben und menschliche juristische Prüfung der Rechtstexte.
- Ausdrückliche Produktionsfreigabe erst nach P8/P9. Entwicklung der übrigen Pakete ist unabhängig möglich.

## Arbeitsplan für GitHub und den späteren VPS · 23. November 2026

Die Entwicklung arbeitet P0 bis P9 in der oben aufgeführten Reihenfolge ab. Die Master-Matrix bestimmt den Umfang. Pro Paket werden die betroffenen IDs, der Git-Commit, die ausgeführten Prüfungen und die verbleibenden Abnahmen festgehalten.

| Umgebung | Arbeit und Nachweis |
|---|---|
| Entwicklungsbranch | Änderungen einschließlich Migrationen versionieren. Für Nutzerabläufe UI, API, Rechte und Speicherung gemeinsam prüfen. Für Fehler einen reproduzierbaren Fall festhalten. |
| GitHub | Den gesicherten Branch nach Klärung des Zugriffs übertragen. Der vorhandene Actions-Workflow startet PostgreSQL 18 als temporären Dienst. Migration zweimal anwenden, API- und Browsertests mit synthetischen Konten, Produktionsbuild und Quellen-Restore ausführen. Den Lauf zum Commit verlinken. |
| VPS-Staging | Release-Commit mit dauerhafter Datenbank und Medienablage installieren. HTTPS, SMTP, Neustart, Backup einschließlich Medien, Wiederherstellung und Rückkehr zur vorherigen Version proben. Betreiberangaben und Geräteabnahme ergänzen. |
| Öffentlicher Betrieb | Nach Freigabe denselben geprüften Stand veröffentlichen. Anmeldung, Verifizierung, Sichtbarkeit, Upload und Fehlermeldungen auf der tatsächlichen Domain prüfen. |

### Stand und nächster Auftrag

Der Baseline-Commit `54d22fc` enthält die zuvor offenen 0.6-Dateien samt Migration. Die folgende Änderung umfasst den Sitzungsaufbau für die Glocke nach Neuladen und die Seitensteuerung für Benachrichtigungen und Merkliste. Aktuelle Nachweise stehen in [TESTS.md](TESTS.md).

Als Nächstes folgt P1 mit **Kommentar melden → Moderation prüft → Entscheidung wird protokolliert**. Abnahmekriterien sind eine persistente Meldung am konkreten Kommentar, Schutz vor Fremdzugriff, eine nachvollziehbare Moderationsentscheidung und der geprüfte Ablauf mit zwei Mitgliedern und einem Moderator. Danach folgen Beitragsbilder, Forenkategorien und die übrigen P1-Punkte. Den GitHub-Lauf nachholen, nach der Übertragung ins bestätigte Zielrepo.
