# GLinks CR Backend

## Local Database Setup

The local PostgreSQL can be created with the following commands (replace username and password):
```
CREATE USER username WITH PASSWORD 'password';
CREATE DATABASE glinks OWNER username;
GRANT ALL PRIVILEGES ON DATABASE glinks TO username;
```

The ```.env``` file must contain the database URL. The format is:
```DATABASE_URL="postgresql://[username]:[password]@localhost:5432/glinks"```

Synchronize Prisma schema with local PostgreSQL database (for initialization only):
```
npx prisma migrate dev --name init
```

Add initial records to the database:
npx prisma db seed

## Changes to the Database

If any change to the database schema is needed, do this:
1. Edit 'prisma/schema.prisma' as needed.
2. Run ```npx prisma migrate dev --name [description]```. Replace \[description\] with a meaningful description of what changed.
3. Commit and push changes.

Whenever there is an incoming change to the database, do a ```git pull``` followed by a ```npx prisma migrate dev``` to synchronize the schema changes.
