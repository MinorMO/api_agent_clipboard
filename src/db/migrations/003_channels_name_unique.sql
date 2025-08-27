-- Unicidad por propietario y nombre (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_owner_channel_name
ON channels(owner_user_id, lower(name));
