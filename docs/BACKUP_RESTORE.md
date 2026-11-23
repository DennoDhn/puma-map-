# Backup and restore runbook

**Documented procedure only — no production backup or restore has been verified.**

- Before importing the old system, create a PostgreSQL custom-format `pg_dump` and an independent
  archive of the existing application/configuration/private uploads. Keep credentials separate.
- Encrypt backups, restrict access, store a second copy off-host, and record a checksum and timestamp.
- Retain at least a daily recovery point during initial operation; define actual RPO/RTO and
  retention with the operator before launch. Use WAL archiving/PITR if the agreed recovery target
  requires it. Do not silently assume a daily backup is sufficient.
- Source Git history is not a database backup. Never place private backups in GitHub or public storage.

## Restore rehearsal

1. Select a backup and verify its checksum/decryption without changing the live database.
2. Provision a clean isolated PostgreSQL instance of a compatible version.
3. Restore with `pg_restore --exit-on-error --no-owner` into the new test database.
4. Apply only reviewed compatible migrations, if any. Reconcile schema and row counts.
5. Compare expected user/vehicle/content counts and run owner/privacy queries and auth smoke tests.
6. Validate original upload objects and references when uploads are implemented.
7. Record elapsed time, backup age, failed statements and observed recovery point.
8. Keep the live environment untouched until a deliberate traffic/connection switch is approved.

To respect account deletion, define backup expiry and a deletion replay process so restoring an
older backup does not silently re-publish deleted accounts. Operational ownership remains open.

## Media introduced in 0.4

The database now contains optimized private image bytes. A complete database backup must include
VehicleMedia and all dependent tables and be encrypted/access controlled like member data. There
is no separate uploads directory to copy. Account deletion also removes live image rows, but backup
retention/deletion replay still require an operator process. Monitor database/WAL/backup growth.
A full image-inclusive restore drill remains unexecuted and blocks production acceptance.

## 0.5 continuation

See [HANDOFF_05.md](HANDOFF_05.md) for the current revision protocol, snapshot whitelist, retention, private recovery, preservation checks and remaining work. This supersedes earlier statements that journal recovery is absent.

## 0.6: tatsächlich ausgeführter Datenbank-Restore

`scripts/test-cold-restore.mjs` erzeugt ausschließlich einen neuen synthetischen Cluster in einem
zufällig benannten `.local/restore-drill-*`-Verzeichnis. Es akzeptiert keinen vorhandenen Quell-
oder Zielcluster. Es wendet alle Migrationen an und schreibt synthetische private Fahrzeug-,
Historien-, Versions-, Medien-, Themen- und Abonnementdaten. Danach:

1. Jede Tabelle wird einschließlich binärer Spalten deterministisch gehasht.
2. PostgreSQL wird sauber gestoppt, der gesamte Cluster kopiert und jede Datei per SHA-256 verglichen.
3. Eine weitere Kopie wird separat mit derselben PostgreSQL-Laufzeit gestartet.
4. Sämtliche Tabellen-Hashes, Privatstatus und Kosten werden verglichen.
5. Migrationen werden erneut ausgeführt; Tabellen-Hashes müssen unverändert bleiben.
6. Die synthetischen Datenverzeichnisse werden nach dem Test gelöscht.

Ausführung benötigt Node 24, Projektabhängigkeiten und eine separat installierte
`embedded-postgres`-Testlaufzeit. Im geprüften Durchlauf wurde die bereits vorhandene Version
18.6.0-beta.19 ausschließlich als lokaler Testadapter genutzt, nicht als Produktionsabhängigkeit.
Setze `TEST_DATABASE_CONFIRM=isolated` und `EMBEDDED_PG_MODULE` auf deren absoluten ESM-Einstieg,
dann `node scripts/test-cold-restore.mjs`. Es werden keine Passwörter protokolliert.

Ergebnis: 22 Tabellen, 13 Zeilen, 1401 Clusterdateien erfolgreich verglichen; echte synthetische
WebP-Daten enthalten; Migrationswiederholung erfolgreich. Das ist ein kaltes physisches Backup mit
identischer Runtime, kein portables pg_dump-Backup, kein Live-Backup und kein PITR-Nachweis.
Produktiv sind verschlüsselte Offsite-Sicherung, Aufbewahrung, Wiederherstellung auf dem Zielhost,
RPO/RTO und Wiederanwendung von Löschentscheidungen zusätzlich abzunehmen. Niemals einen laufenden
Cluster mit einfacher Dateikopie sichern und diesen Test als Bestätigung dafür verwenden.
