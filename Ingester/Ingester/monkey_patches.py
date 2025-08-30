from pymongo.database import Database

def _database_bool(self):
    return self.client is not None

Database.__bool__ = _database_bool