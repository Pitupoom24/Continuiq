CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR,
  x_pos FLOAT NOT NULL DEFAULT 0,
  y_pos FLOAT NOT NULL DEFAULT 0,
  width INT DEFAULT 400,
  height INT DEFAULT 600,
  z_index INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  role VARCHAR CHECK (role IN ('user', 'model')),
  content TEXT NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE message_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  start_offset INT NOT NULL, 
  end_offset INT NOT NULL, 
  from_chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  to_chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);