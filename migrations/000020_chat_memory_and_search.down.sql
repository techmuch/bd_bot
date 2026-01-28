DROP TABLE IF EXISTS chat_messages;
DROP TRIGGER IF EXISTS tsvectorupdate ON solicitations;
DROP FUNCTION IF EXISTS solicitations_tsvector_trigger;
ALTER TABLE solicitations DROP COLUMN IF EXISTS text_search;
