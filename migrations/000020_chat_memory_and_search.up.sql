CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE solicitations ADD COLUMN text_search tsvector;
CREATE INDEX idx_solicitations_search ON solicitations USING GIN(text_search);

UPDATE solicitations SET text_search = 
    setweight(to_tsvector('english', coalesce(title,'')), 'A') || 
    setweight(to_tsvector('english', coalesce(description,'')), 'B');

CREATE FUNCTION solicitations_tsvector_trigger() RETURNS trigger AS $$
BEGIN
  new.text_search :=
  setweight(to_tsvector('english', coalesce(new.title,'')), 'A') ||
  setweight(to_tsvector('english', coalesce(new.description,'')), 'B');
  return new;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON solicitations FOR EACH ROW EXECUTE PROCEDURE solicitations_tsvector_trigger();
