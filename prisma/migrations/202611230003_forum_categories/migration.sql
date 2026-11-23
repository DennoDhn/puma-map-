CREATE TABLE "ForumCategory" (
  "name" TEXT PRIMARY KEY,
  "parentName" TEXT REFERENCES "ForumCategory"("name") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "ForumCategory" ("name") VALUES ('Allgemein'), ('Werkstatt'), ('Community');
INSERT INTO "ForumCategory" VALUES
  ('Motor','Werkstatt'), ('Fahrwerk','Werkstatt'), ('Bremsen','Werkstatt'), ('Elektrik','Werkstatt'),
  ('Karosserie','Werkstatt'), ('Innenraum','Werkstatt'), ('Wartung','Werkstatt'), ('Teile','Werkstatt'),
  ('Fahrzeuge','Community'), ('Treffen','Community');

ALTER TABLE "Content" ADD COLUMN "forumCategoryName" TEXT REFERENCES "ForumCategory"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE FUNCTION pumamap_topic_category() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."kind" = 'TOPIC' THEN
    NEW."forumCategoryName" := COALESCE((SELECT "name" FROM "ForumCategory" WHERE "name" = NEW."category"), 'Allgemein');
  ELSE
    NEW."forumCategoryName" := NULL;
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER pumamap_sync_topic_category BEFORE INSERT OR UPDATE OF "kind", "category" ON "Content"
FOR EACH ROW EXECUTE FUNCTION pumamap_topic_category();
UPDATE "Content" SET "category" = "category" WHERE "kind" = 'TOPIC';
CREATE INDEX "Content_forumCategoryName_createdAt_idx" ON "Content" ("forumCategoryName","createdAt");
